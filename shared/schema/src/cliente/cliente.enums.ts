export const STATUS_FILTRO_CLIENTE = [
  'ativos',
  'inativos',
  'todos',
] as const;

export type StatusFiltroCliente = (typeof STATUS_FILTRO_CLIENTE)[number];

export const SEGMENTO_CLIENTE = [
  'todas',
  'atendidas_30_dias',
  'novas',
] as const;

export type SegmentoCliente = (typeof SEGMENTO_CLIENTE)[number];

export const ORDENACAO_CLIENTE = [
  'nome',
  'ultimo_atendimento',
  'maior_valor_gasto',
] as const;

export type OrdenacaoCliente = (typeof ORDENACAO_CLIENTE)[number];
