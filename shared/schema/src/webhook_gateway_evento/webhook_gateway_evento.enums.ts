export const TIPO_EVENTO_GATEWAY = [
  'cobranca_confirmada',
  'reembolso_confirmado',
  'falhou',
] as const;
export type TipoEventoGateway = (typeof TIPO_EVENTO_GATEWAY)[number];

export const STATUS_WEBHOOK_GATEWAY = [
  'recebido',
  'processando',
  'processado',
  'ignorado',
  'falhou',
  'morto',
] as const;
export type StatusWebhookGateway = (typeof STATUS_WEBHOOK_GATEWAY)[number];
