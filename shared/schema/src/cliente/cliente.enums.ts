// Sem enums próprios.
export const STATUS_FILTRO_CLIENTE = [
  'ativos',
  'inativos',
  'todos',
] as const;

export type StatusFiltroCliente = (typeof STATUS_FILTRO_CLIENTE)[number];
