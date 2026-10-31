import { and, eq, sql } from 'drizzle-orm';
import {
  autorizacaoProprietario,
  identidadeAutenticacao,
  usuario,
  usuarioSalao,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  CriarOuObterUsuarioInput,
  ResultadoCriarOuObterUsuario,
  UsuarioPersistido,
} from '@/modules/usuario/contracts';

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

@Injectable()
export class UsuarioRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarPorIdentidade(input: {
    provedor: CriarOuObterUsuarioInput['identity']['provider'];
    identificadorExterno: string;
  }): Promise<UsuarioPersistido | undefined> {
    const resultados = (await this.database
      .select({ usuario })
      .from(identidadeAutenticacao)
      .innerJoin(usuario, eq(identidadeAutenticacao.usuario_id, usuario.id))
      .where(
        and(
          eq(identidadeAutenticacao.provedor, input.provedor),
          eq(
            identidadeAutenticacao.identificador_externo,
            input.identificadorExterno,
          ),
        ),
      )
      .limit(1)) as Array<{ usuario: UsuarioPersistido }>;

    return resultados[0]?.usuario;
  }

  async possuiVinculoSalao(usuarioId: string): Promise<boolean> {
    const resultados = await this.database
      .select({ id: usuarioSalao.id })
      .from(usuarioSalao)
      .where(eq(usuarioSalao.usuario_id, usuarioId))
      .limit(1);

    return resultados.length > 0;
  }

  async possuiAutorizacaoProprietario(usuarioId: string): Promise<boolean> {
    const resultados = await this.database
      .select({ id: autorizacaoProprietario.id })
      .from(autorizacaoProprietario)
      .where(eq(autorizacaoProprietario.usuario_id, usuarioId))
      .limit(1);

    return resultados.length > 0;
  }

  async criarOuObter(
    input: CriarOuObterUsuarioInput,
  ): Promise<ResultadoCriarOuObterUsuario> {
    return this.database.transaction(async (tx) => {
      if (input.referenciaConviteClerk) {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`convite:${input.referenciaConviteClerk}`}, 0))`,
        );
      }

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${`identidade:${input.identity.provider}:${input.identity.subject}`}, 0))`,
      );

      const identidadeExistente = await buscarIdentidade(tx, input);

      if (identidadeExistente) {
        if (input.referenciaConviteClerk) {
          const possuiAutorizacao = await buscarAutorizacaoPorUsuario(
            tx,
            identidadeExistente.id,
          );

          if (!possuiAutorizacao) {
            const referenciaUsada = await buscarAutorizacaoPorReferencia(
              tx,
              input.referenciaConviteClerk,
            );

            if (referenciaUsada) {
              return { status: 'convite_consumido' };
            }

            await tx.insert(autorizacaoProprietario).values({
              usuario_id: identidadeExistente.id,
              referencia_convite_clerk: input.referenciaConviteClerk,
              origem: 'convite',
            });
          }
        }

        return { status: 'existente', usuario: identidadeExistente };
      }

      if (input.exigirConvite && !input.referenciaConviteClerk) {
        return { status: 'convite_necessario' };
      }

      if (
        input.referenciaConviteClerk &&
        (await buscarAutorizacaoPorReferencia(tx, input.referenciaConviteClerk))
      ) {
        return { status: 'convite_consumido' };
      }

      const emailsExistentes = (await tx
        .select({ id: usuario.id })
        .from(usuario)
        .where(sql`lower(${usuario.email}) = ${normalizarEmail(input.email)}`)
        .limit(1)) as Array<{ id: string }>;

      if (emailsExistentes[0]) {
        return { status: 'email_em_uso' };
      }

      const [usuarioCriado] = await tx
        .insert(usuario)
        .values({
          nome: input.nome,
          sobrenome: input.sobrenome,
          email: normalizarEmail(input.email),
        })
        .returning();

      await tx.insert(identidadeAutenticacao).values({
        usuario_id: usuarioCriado.id,
        provedor: input.identity.provider,
        identificador_externo: input.identity.subject,
      });

      if (input.referenciaConviteClerk) {
        await tx.insert(autorizacaoProprietario).values({
          usuario_id: usuarioCriado.id,
          referencia_convite_clerk: input.referenciaConviteClerk,
          origem: 'convite',
        });
      }

      return { status: 'criado', usuario: usuarioCriado };
    });
  }
}

async function buscarIdentidade(
  tx: Transaction,
  input: CriarOuObterUsuarioInput,
): Promise<UsuarioPersistido | undefined> {
  const resultados = (await tx
    .select({ usuario })
    .from(identidadeAutenticacao)
    .innerJoin(usuario, eq(identidadeAutenticacao.usuario_id, usuario.id))
    .where(
      and(
        eq(identidadeAutenticacao.provedor, input.identity.provider),
        eq(
          identidadeAutenticacao.identificador_externo,
          input.identity.subject,
        ),
      ),
    )
    .limit(1)) as Array<{ usuario: UsuarioPersistido }>;

  return resultados[0]?.usuario;
}

async function buscarAutorizacaoPorUsuario(
  tx: Transaction,
  usuarioId: string,
): Promise<boolean> {
  const resultados = await tx
    .select({ id: autorizacaoProprietario.id })
    .from(autorizacaoProprietario)
    .where(eq(autorizacaoProprietario.usuario_id, usuarioId))
    .limit(1);

  return resultados.length > 0;
}

async function buscarAutorizacaoPorReferencia(
  tx: Transaction,
  referencia: string,
): Promise<boolean> {
  const resultados = await tx
    .select({ id: autorizacaoProprietario.id })
    .from(autorizacaoProprietario)
    .where(eq(autorizacaoProprietario.referencia_convite_clerk, referencia))
    .limit(1);

  return resultados.length > 0;
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}
