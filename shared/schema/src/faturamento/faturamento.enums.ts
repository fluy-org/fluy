export const PRESET_PERIODO_FATURAMENTO = [
  'semana_atual',
  'semana_anterior',
  'mes_atual',
  'mes_anterior',
  'quinzena_atual',
] as const;
export type PresetPeriodoFaturamento =
  (typeof PRESET_PERIODO_FATURAMENTO)[number];

export const MOTIVO_SINAL_RETIDO = [
  'cancelamento_cliente',
  'cancelamento_salao',
  'falta',
] as const;
export type MotivoSinalRetido = (typeof MOTIVO_SINAL_RETIDO)[number];

export const ORIGEM_PAGAMENTO = ['manual', 'gateway'] as const;
export type OrigemPagamento = (typeof ORIGEM_PAGAMENTO)[number];
