import { inArray, sql, type SQL } from 'drizzle-orm';
import { agendamento, cobrancaGateway, cobrancaManual } from '@fluy/schema';

// "Quanto entrou" é uma regra só no produto: o faturamento do período e o
// total gasto da ficha da cliente saem daqui para nunca divergirem.
const ESTADOS_COM_RECEBIMENTO = ['concluido', 'cancelado', 'falta'] as const;

// Supõe `cobranca_manual` e `cobranca_gateway` ligadas por left join ao
// `pagamento_agendamento` da consulta. Cobrança manual só existe quando o
// dinheiro entrou; a de gateway só conta depois de confirmada.
export function montarValorRecebido(): SQL<string> {
  return sql<string>`coalesce(
    ${cobrancaManual.valor},
    case when ${cobrancaGateway.status} = 'confirmada' then ${cobrancaGateway.valor} end,
    0
  )`;
}

// Sinal de agendamento que ainda não terminou não é receita: só conta depois
// de concluído ou retido em cancelamento/falta.
export function montarFiltroEstadosComRecebimento(): SQL {
  return inArray(agendamento.estado, [...ESTADOS_COM_RECEBIMENTO]);
}
