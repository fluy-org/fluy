export const METODO_PAGAMENTO_MANUAL = [
  'dinheiro',
  'pix_pessoal',
  'cartao_maquina',
  'outro',
] as const;
export type MetodoPagamentoManual = (typeof METODO_PAGAMENTO_MANUAL)[number];
