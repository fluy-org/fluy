export const FUSOS_HORARIOS_BRASIL = [
  'America/Noronha',
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Rio_Branco',
] as const;

export type FusoHorarioBrasil = (typeof FUSOS_HORARIOS_BRASIL)[number];
