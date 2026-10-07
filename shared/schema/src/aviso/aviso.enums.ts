export const TIPO_AVISO = [
  'generico',
  'agendamento_criado',
  'agendamento_remarcado',
  'agendamento_cancelado',
  'novo_agendamento_salao',
  'cancelamento_cliente_salao',
  'lembrete_vencido',
] as const;

export type TipoAviso = (typeof TIPO_AVISO)[number];
