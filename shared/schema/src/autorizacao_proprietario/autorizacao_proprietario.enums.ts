export const ORIGENS_AUTORIZACAO_PROPRIETARIO = [
  'convite',
  'legado',
] as const;

export type OrigemAutorizacaoProprietario =
  (typeof ORIGENS_AUTORIZACAO_PROPRIETARIO)[number];
