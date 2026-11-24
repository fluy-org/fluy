export const TIPO_AVISO = [
  'generico',
  'agendamento_criado',
  'agendamento_remarcado',
  'agendamento_cancelado',
  'novo_agendamento_salao',
  'cancelamento_cliente_salao',
  'lembrete_vencido',
  'agendamento_pago_confirmado',
  'pagamento_apos_prazo',
] as const;

export type TipoAviso = (typeof TIPO_AVISO)[number];
