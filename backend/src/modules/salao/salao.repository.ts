import { and, eq } from 'drizzle-orm';
import {
  configuracaoSalao,
  profissional,
  salao,
  usuarioSalao,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '../../database/inject-database.decorator';
import type { Database } from '../../database/database.provider';
import type { CriarSalaoPersistenciaInput, SalaoPersistido } from './contracts';

@Injectable()
export class SalaoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarSalaoDoDono(
    usuarioId: string,
  ): Promise<SalaoPersistido | undefined> {
    const resultados = await this.database
      .select({ salao })
      .from(usuarioSalao)
      .innerJoin(salao, eq(usuarioSalao.salao_id, salao.id))
      .where(
        and(
          eq(usuarioSalao.usuario_id, usuarioId),
          eq(usuarioSalao.papel, 'dono'),
        ),
      )
      .limit(1);

    const [resultado] = resultados;

    return resultado?.salao;
  }

  async buscarPorSubdominio(subdominio: string): Promise<boolean> {
    const resultados = await this.database
      .select({ id: salao.id })
      .from(salao)
      .where(eq(salao.subdominio, subdominio))
      .limit(1);

    return resultados.length > 0;
  }

  async criar(input: CriarSalaoPersistenciaInput): Promise<SalaoPersistido> {
    return this.database.transaction(async (tx) => {
      const saloesCriados = await tx
        .insert(salao)
        .values({
          nome: input.nome,
          subdominio: input.subdominio,
          contato_whatsapp: input.contato_whatsapp,
          endereco: input.endereco,
          fuso_horario: input.fuso_horario,
        })
        .returning();

      const [salaoCriado] = saloesCriados;

      await tx.insert(usuarioSalao).values({
        usuario_id: input.usuarioId,
        salao_id: salaoCriado.id,
        papel: 'dono',
      });

      await tx.insert(configuracaoSalao).values({
        salao_id: salaoCriado.id,
      });

      await tx.insert(profissional).values({
        salao_id: salaoCriado.id,
        nome: input.nomeProfissional,
      });

      return salaoCriado;
    });
  }
}
