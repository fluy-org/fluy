import { and, eq } from 'drizzle-orm';
import { identidadeAutenticacao, usuario, usuarioSalao } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '../../database/inject-database.decorator';
import type { Database } from '../../database/database.provider';
import type {
  CriarOuObterUsuarioInput,
  ResultadoCriarOuObterUsuario,
  UsuarioPersistido,
} from './contracts';

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

    const [resultado] = resultados;

    return resultado?.usuario;
  }

  async possuiVinculoSalao(usuarioId: string): Promise<boolean> {
    const resultados = await this.database
      .select({ id: usuarioSalao.id })
      .from(usuarioSalao)
      .where(eq(usuarioSalao.usuario_id, usuarioId))
      .limit(1);

    return resultados.length > 0;
  }

  async criarOuObter(
    input: CriarOuObterUsuarioInput,
  ): Promise<ResultadoCriarOuObterUsuario> {
    return this.database.transaction(async (tx) => {
      const identidadesExistentes = (await tx
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

      const [identidadeExistente] = identidadesExistentes;

      if (identidadeExistente) {
        return { status: 'existente', usuario: identidadeExistente.usuario };
      }

      const emailsExistentes = (await tx
        .select({ id: usuario.id })
        .from(usuario)
        .where(eq(usuario.email, input.email))
        .limit(1)) as Array<{ id: string }>;

      const [emailExistente] = emailsExistentes;

      if (emailExistente) {
        return { status: 'email_em_uso' };
      }

      const usuariosCriados = await tx
        .insert(usuario)
        .values({
          nome: input.nome,
          sobrenome: input.sobrenome,
          email: input.email,
        })
        .returning();

      const [usuarioCriado] = usuariosCriados;

      await tx.insert(identidadeAutenticacao).values({
        usuario_id: usuarioCriado.id,
        provedor: input.identity.provider,
        identificador_externo: input.identity.subject,
      });

      return { status: 'criado', usuario: usuarioCriado };
    });
  }
}
