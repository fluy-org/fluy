import type {
  FaturamentoResponseDto,
  ListaAtendimentosFaturamentoResponseDto,
  PagamentoFaturamentoDto,
} from '@fluy/schema';
import type {
  FaturamentoResultado,
  ListaAtendimentosFaturamentoResultado,
  PagamentoFaturamento,
} from '@/modules/faturamento/contracts';

export function toFaturamentoResponse({
  fusoHorario,
  periodo,
  resumo,
  recebimentoPorMetodo,
  sinaisRetidos,
}: FaturamentoResultado): FaturamentoResponseDto {
  return {
    fuso_horario: fusoHorario,
    periodo: {
      data_inicio: periodo.dataInicio,
      data_fim: periodo.dataFim,
    },
    resumo: {
      total_faturado: emReais(resumo.total_faturado_centavos),
      total_concluidos: resumo.total_concluidos,
      ticket_medio:
        resumo.ticket_medio_centavos === null
          ? null
          : emReais(resumo.ticket_medio_centavos),
      total_pendentes: resumo.total_pendentes,
    },
    recebimento_por_metodo: recebimentoPorMetodo.map(toPagamentoFaturamento),
    sinais_retidos: sinaisRetidos.map((sinal) => ({
      agendamento_id: sinal.agendamento_id,
      ocorreu_em: sinal.ocorreu_em.toISOString(),
      cliente: sinal.cliente,
      procedimento: sinal.procedimento,
      valor: emReais(sinal.valor_centavos),
      motivo: sinal.motivo,
    })),
  };
}

export function toListaAtendimentosFaturamentoResponse({
  fusoHorario,
  itens,
  proximoCursor,
}: ListaAtendimentosFaturamentoResultado): ListaAtendimentosFaturamentoResponseDto {
  return {
    fuso_horario: fusoHorario,
    itens: itens.map((atendimento) => ({
      agendamento_id: atendimento.agendamento_id,
      ocorreu_em: atendimento.ocorreu_em.toISOString(),
      cliente: atendimento.cliente,
      procedimento: atendimento.procedimento,
      valor_total: emReais(atendimento.valor_total_centavos),
      sinal: atendimento.sinal
        ? toPagamentoFaturamento(atendimento.sinal)
        : null,
      restante: atendimento.restante
        ? toPagamentoFaturamento(atendimento.restante)
        : null,
      valor_pendente: emReais(atendimento.valor_pendente_centavos),
    })),
    proximo_cursor: proximoCursor,
  };
}

function toPagamentoFaturamento(
  pagamento: PagamentoFaturamento,
): PagamentoFaturamentoDto {
  return {
    valor: emReais(pagamento.valor_centavos),
    origem: pagamento.origem,
    metodo: pagamento.metodo,
  };
}

function emReais(centavos: number): number {
  return centavos / 100;
}
