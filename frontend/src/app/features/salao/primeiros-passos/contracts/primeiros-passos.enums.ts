export const ETAPAS_PRIMEIROS_PASSOS = [
  'procedimento',
  'disponibilidade',
  'pix',
  'link',
] as const;

export type EtapaPrimeirosPassos = (typeof ETAPAS_PRIMEIROS_PASSOS)[number];
