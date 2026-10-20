export const METODO_PAGAMENTO_GATEWAY = ['pix', 'cartao'] as const;
export type MetodoPagamentoGateway = (typeof METODO_PAGAMENTO_GATEWAY)[number];

export const MODALIDADE_PAGAMENTO_GATEWAY = ['sinal', 'total'] as const;
export type ModalidadePagamentoGateway = (typeof MODALIDADE_PAGAMENTO_GATEWAY)[number];

export const STATUS_COBRANCA_GATEWAY = [
  'iniciando',
  'pendente',
  'confirmada',
  'expirada',
  'falhou',
] as const;
export type StatusCobrancaGateway = (typeof STATUS_COBRANCA_GATEWAY)[number];

export const RESULTADO_SIMULACAO_PAGAMENTO = [
  'confirmado',
  'falhou',
  'expirado',
] as const;
export type ResultadoSimulacaoPagamento =
  (typeof RESULTADO_SIMULACAO_PAGAMENTO)[number];

export const SITUACAO_PAGAMENTO_PIX = [
  'normal',
  'confirmado_apos_expiracao',
] as const;
export type SituacaoPagamentoPix = (typeof SITUACAO_PAGAMENTO_PIX)[number];
