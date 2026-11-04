export const ESTADO_PAGINA_AGENDA = [
  'carregando',
  'offline',
  'erro',
  'vazio',
  'lista',
] as const;
export type EstadoPaginaAgenda = (typeof ESTADO_PAGINA_AGENDA)[number];
export const ESTADO_PAGINA_DETALHE = [
  'carregando',
  'offline',
  'erro',
  'detalhe',
] as const;
export type EstadoPaginaDetalhe = (typeof ESTADO_PAGINA_DETALHE)[number];
