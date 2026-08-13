export const ESTADO_AGENDAMENTO = [
  'reservado',
  'agendado',
  'concluido',
  'cancelado',
  'falta',
] as const;
export type EstadoAgendamento = (typeof ESTADO_AGENDAMENTO)[number];
