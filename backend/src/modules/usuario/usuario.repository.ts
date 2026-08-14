import { and, eq } from 'drizzle-orm';
import { identidadeAutenticacao, usuario } from '@fluy/schema';
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

      const usuariosCriados = (await tx
        .insert(usuario)
        .values({
          nome: input.nome,
          sobrenome: input.sobrenome,
          email: input.email,
        })
        .returning()) as UsuarioPersistido[];

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
