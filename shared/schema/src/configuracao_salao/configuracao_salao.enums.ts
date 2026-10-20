export const TIPO_CHAVE_PIX = [
  'cpf',
  'cnpj',
  'email',
  'telefone',
  'aleatoria',
] as const;
export type TipoChavePix = (typeof TIPO_CHAVE_PIX)[number];
