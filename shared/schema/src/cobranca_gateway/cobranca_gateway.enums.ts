export const METODO_PAGAMENTO_GATEWAY = ['pix', 'cartao'] as const;
export type MetodoPagamentoGateway = (typeof METODO_PAGAMENTO_GATEWAY)[number];

export const STATUS_COBRANCA_GATEWAY = [
  'pendente',
  'confirmada',
  'expirada',
  'falhou',
] as const;
export type StatusCobrancaGateway = (typeof STATUS_COBRANCA_GATEWAY)[number];
