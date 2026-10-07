import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import {
  type OrigemPagamento,
  agendamento,
  cliente,
  cobrancaGateway,
  cobrancaManual,
  eventoAgendamento,
  pagamentoAgendamento,
  procedimento,
} from '@fluy/schema';
import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '@/database/inject-database.decorator';
import type { Database } from '@/database/database.provider';
import {
  montarFiltroEstadosComRecebimento,
  montarValorRecebido,
} from '@/shared/recebimento/recebimento.utils';
import type {
  EncerramentoPersistido,
  ListarAtendimentosFaturamentoPersistenciaInput,
  ListarEncerramentosPersistenciaInput,
  MetodoPagamentoFaturamento,
  PagamentoDoEncerramentoPersistido,
} from '@/modules/faturamento/contracts';

const TIPOS_DE_ENCERRAMENTO = ['concluido', 'cancelado', 'falta'] as const;

@Injectable()
export class FaturamentoRepository {
  constructor(@InjectDatabase() private readonly database: Database) {}

  async listarEncerramentosDoPeriodo(
    input: ListarEncerramentosPersistenciaInput,
  ): Promise<EncerramentoPersistido[]> {
    const encerramentos = await this.selecionarEncerramentos()
      .where(
        this.filtrarEncerramentos({ ...input, tipos: TIPOS_DE_ENCERRAMENTO }),
      )
      .orderBy(desc(eventoAgendamento.ocorreu_em), desc(agendamento.id));

    return this.anexarPagamentos({ salaoId: input.salaoId, encerramentos });
  }

  async listarAtendimentosDoPeriodo(
    input: ListarAtendimentosFaturamentoPersistenciaInput,
  ): Promise<EncerramentoPersistido[]> {
    const encerramentos = await this.selecionarEncerramentos()
      .where(this.filtrarEncerramentos({ ...input, tipos: ['concluido'] }))
      .orderBy(desc(eventoAgendamento.ocorreu_em), desc(agendamento.id))
      .limit(input.limite)
      .offset(input.offset);

    return this.anexarPagamentos({ salaoId: input.salaoId, encerramentos });
  }

  private selecionarEncerramentos() {
    return this.database
      .select({
        agendamento_id: agendamento.id,
        tipo: eventoAgendamento.tipo,
        ocorreu_em: eventoAgendamento.ocorreu_em,
        cancelado_por: eventoAgendamento.cancelado_por,
        preco_total_centavos:
          sql<number>`round(${agendamento.preco_total} * 100)`.mapWith(Number),
        cliente: { id: cliente.id, nome: cliente.nome },
        procedimento: { id: procedimento.id, nome: procedimento.nome },
      })
      .from(eventoAgendamento)
      .innerJoin(
        agendamento,
        eq(agendamento.id, eventoAgendamento.agendamento_id),
      )
      .innerJoin(cliente, eq(cliente.id, agendamento.cliente_id))
      .innerJoin(
        procedimento,
        eq(procedimento.id, agendamento.procedimento_id),
      );
  }

  private filtrarEncerramentos({
    salaoId,
    inicio,
    fim,
    tipos,
  }: ListarEncerramentosPersistenciaInput & {
    tipos: readonly (typeof TIPOS_DE_ENCERRAMENTO)[number][];
  }) {
    return and(
      eq(agendamento.salao_id, salaoId),
      inArray(eventoAgendamento.tipo, [...tipos]),
      gte(eventoAgendamento.ocorreu_em, inicio),
      lt(eventoAgendamento.ocorreu_em, fim),
      montarFiltroEstadosComRecebimento(),
    );
  }

  private async anexarPagamentos({
    salaoId,
    encerramentos,
  }: {
    salaoId: string;
    encerramentos: Omit<EncerramentoPersistido, 'pagamentos'>[];
  }): Promise<EncerramentoPersistido[]> {
    if (encerramentos.length === 0) {
      return [];
    }

    const pagamentos = await this.database
      .select({
        agendamento_id: pagamentoAgendamento.agendamento_id,
        tipo: pagamentoAgendamento.tipo,
        origem: sql<OrigemPagamento>`case when ${pagamentoAgendamento.cobranca_manual_id} is not null then 'manual' else 'gateway' end`,
        metodo: sql<MetodoPagamentoFaturamento>`coalesce(${cobrancaManual.metodo}, ${cobrancaGateway.metodo})`,
        valor_centavos:
          sql<number>`round(${montarValorRecebido()} * 100)`.mapWith(Number),
      })
      .from(pagamentoAgendamento)
      .innerJoin(
        agendamento,
        eq(agendamento.id, pagamentoAgendamento.agendamento_id),
      )
      .leftJoin(
        cobrancaManual,
        eq(cobrancaManual.id, pagamentoAgendamento.cobranca_manual_id),
      )
      .leftJoin(
        cobrancaGateway,
        eq(cobrancaGateway.id, pagamentoAgendamento.cobranca_gateway_id),
      )
      .where(
        and(
          eq(agendamento.salao_id, salaoId),
          inArray(
            pagamentoAgendamento.agendamento_id,
            encerramentos.map((encerramento) => encerramento.agendamento_id),
          ),
        ),
      );

    const pagamentosPorAgendamento = new Map<
      string,
      PagamentoDoEncerramentoPersistido[]
    >();

    for (const { agendamento_id, ...pagamento } of pagamentos) {
      const doAgendamento = pagamentosPorAgendamento.get(agendamento_id) ?? [];
      doAgendamento.push(pagamento);
      pagamentosPorAgendamento.set(agendamento_id, doAgendamento);
    }

    return encerramentos.map((encerramento) => ({
      ...encerramento,
      pagamentos:
        pagamentosPorAgendamento.get(encerramento.agendamento_id) ?? [],
    }));
  }
}
