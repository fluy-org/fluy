export const TIPO_EVENTO_AGENDAMENTO = [
  'cancelado',
  'concluido',
  'falta',
  'remarcado',
] as const;
export type TipoEventoAgendamento = (typeof TIPO_EVENTO_AGENDAMENTO)[number];
