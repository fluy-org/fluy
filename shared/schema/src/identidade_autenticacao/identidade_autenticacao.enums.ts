export const PROVEDOR_AUTENTICACAO = ['clerk'] as const;
export type ProvedorAutenticacao = (typeof PROVEDOR_AUTENTICACAO)[number];
