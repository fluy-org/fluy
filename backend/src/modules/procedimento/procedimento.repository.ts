import { and, asc, eq } from 'drizzle-orm';
import { procedimento } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import type {
  AtualizarProcedimentoInput,
  BuscarProcedimentoInput,
  CriarProcedimentoInput,
  ProcedimentoPersistido,
} from '@/modules/procedimento/contracts';

@Injectable()
export class ProcedimentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async listar(salaoId: string): Promise<ProcedimentoPersistido[]> {
    return this.database
      .select()
      .from(procedimento)
      .where(eq(procedimento.salao_id, salaoId))
      .orderBy(asc(procedimento.criado_em));
  }

  async listarAtivos(salaoId: string): Promise<ProcedimentoPersistido[]> {
    return this.database
      .select()
      .from(procedimento)
      .where(
        and(eq(procedimento.salao_id, salaoId), eq(procedimento.ativo, true)),
      )
      .orderBy(asc(procedimento.criado_em));
  }

  async buscarPorId(
    input: BuscarProcedimentoInput,
  ): Promise<ProcedimentoPersistido | undefined> {
    const resultados = await this.database
      .select()
      .from(procedimento)
      .where(
        and(
          eq(procedimento.id, input.id),
          eq(procedimento.salao_id, input.salaoId),
        ),
      )
      .limit(1);

    return resultados[0];
  }

  async criar(input: CriarProcedimentoInput): Promise<ProcedimentoPersistido> {
    const procedimentosCriados = await this.database
      .insert(procedimento)
      .values({
        salao_id: input.salaoId,
        ...input.dados,
        preco: input.dados.preco.toString(),
        valor_sinal: input.dados.valor_sinal.toString(),
      })
      .returning();

    return procedimentosCriados[0];
  }

  async atualizar(
    input: AtualizarProcedimentoInput,
  ): Promise<ProcedimentoPersistido | undefined> {
    const { preco, valor_sinal, ...dados } = input.dados;
    const procedimentosAtualizados = await this.database
      .update(procedimento)
      .set({
        ...dados,
        preco: preco?.toString(),
        valor_sinal: valor_sinal?.toString(),
      })
      .where(
        and(
          eq(procedimento.id, input.id),
          eq(procedimento.salao_id, input.salaoId),
        ),
      )
      .returning();

    return procedimentosAtualizados[0];
  }

  async desativar(
    input: BuscarProcedimentoInput,
  ): Promise<ProcedimentoPersistido | undefined> {
    const procedimentosAtualizados = await this.database
      .update(procedimento)
      .set({ ativo: false })
      .where(
        and(
          eq(procedimento.id, input.id),
          eq(procedimento.salao_id, input.salaoId),
        ),
      )
      .returning();

    return procedimentosAtualizados[0];
  }
}
