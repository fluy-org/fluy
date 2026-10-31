export const ESTADOS_CONVITE_PROPRIETARIO = [
  'pendente',
  'consumido',
  'revogado',
] as const;

export type EstadoConviteProprietario =
  (typeof ESTADOS_CONVITE_PROPRIETARIO)[number];
