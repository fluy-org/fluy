export const TIPO_SINAL = ['percentual', 'fixo'] as const;
export type TipoSinal = (typeof TIPO_SINAL)[number];

export const POLITICA_SINAL = ['obrigatorio', 'opcional'] as const;
export type PoliticaSinal = (typeof POLITICA_SINAL)[number];

