export const TIPO_PAGAMENTO_AGENDAMENTO = ['sinal', 'restante'] as const;
export type TipoPagamentoAgendamento =
  (typeof TIPO_PAGAMENTO_AGENDAMENTO)[number];
