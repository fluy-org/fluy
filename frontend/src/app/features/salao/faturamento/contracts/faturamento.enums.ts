export const ESTADO_PAGINA_FATURAMENTO = [
  'carregando',
  'erro',
  'vazio',
  'relatorio',
] as const;
export type EstadoPaginaFaturamento =
  (typeof ESTADO_PAGINA_FATURAMENTO)[number];
