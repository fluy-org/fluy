export const TIPO_EVENTO_AGENDAMENTO = [
  'cancelado',
  'concluido',
  'falta',
  'remarcado',
] as const;
export type TipoEventoAgendamento = (typeof TIPO_EVENTO_AGENDAMENTO)[number];

export const AUTOR_CANCELAMENTO = ['cliente', 'salao'] as const;
export type AutorCancelamento = (typeof AUTOR_CANCELAMENTO)[number];
