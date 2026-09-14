import { and, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import { agendamento, cliente } from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import {
  adicionarDiasNaData,
  dataHoraCivilParaUtc,
} from '@/shared/horario-salao/horario-salao.utils';
import type {
  AgendamentoPersistido,
  CriarAgendamentoComValidacaoInput,
  OcupacaoProfissional,
} from '@/modules/agendamento/contracts';

@Injectable()
export class AgendamentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async buscarClienteAtivo({
    clienteId,
    salaoId,
  }: {
    clienteId: string;
    salaoId: string;
  }): Promise<boolean> {
    const clientes = await this.database
      .select({ id: cliente.id })
      .from(cliente)
      .where(
        and(
          eq(cliente.id, clienteId),
          eq(cliente.salao_id, salaoId),
          isNull(cliente.removido_em),
        ),
      )
      .limit(1);

    return clientes.length > 0;
  }

  listarOcupacoesDoDia({
    salaoId,
    data,
    fusoHorario,
  }: {
    salaoId: string;
    data: string;
    fusoHorario: string;
  }): Promise<OcupacaoProfissional[]> {
    const inicioDia = dataHoraCivilParaUtc({
      data,
      hora: '00:00',
      fusoHorario,
    });
    const fimDia = dataHoraCivilParaUtc({
      data: adicionarDiasNaData({ data, dias: 1 }),
      hora: '00:00',
      fusoHorario,
    });

    return this.database
      .select({
        profissional_id: agendamento.profissional_id,
        inicio_em: agendamento.inicio_em,
        duracao_min: agendamento.duracao_min,
      })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.salao_id, salaoId),
          inArray(agendamento.estado, ['reservado', 'agendado']),
          gte(agendamento.inicio_em, inicioDia),
          lt(agendamento.inicio_em, fimDia),
        ),
      );
  }

  async criar(
    input: CriarAgendamentoComValidacaoInput,
  ): Promise<AgendamentoPersistido | undefined> {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`${input.salaoId}:${input.dataAgendamento}`}))`,
      );

      const conflitos = await tx
        .select({ id: agendamento.id })
        .from(agendamento)
        .where(
          and(
            eq(agendamento.salao_id, input.salaoId),
            eq(agendamento.profissional_id, input.profissionalId),
            inArray(agendamento.estado, ['reservado', 'agendado']),
            sql`${agendamento.inicio_em} < ${input.inicioEm} + ${input.duracaoMin} * interval '1 minute'`,
            sql`${agendamento.inicio_em} + ${agendamento.duracao_min} * interval '1 minute' > ${input.inicioEm}`,
          ),
        )
        .limit(1);

      if (conflitos.length > 0) {
        return undefined;
      }

      const agendamentosCriados = await tx
        .insert(agendamento)
        .values({
          salao_id: input.salaoId,
          cliente_id: input.clienteId,
          procedimento_id: input.procedimentoId,
          profissional_id: input.profissionalId,
          inicio_em: input.inicioEm,
          duracao_min: input.duracaoMin,
          preco_total: input.precoTotal,
          valor_sinal: input.valorSinal,
          estado: 'agendado',
        })
        .returning();

      return agendamentosCriados[0];
    });
  }
}
