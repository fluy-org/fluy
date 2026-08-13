export const TIPO_SINAL = ['percentual', 'fixo'] as const;
export type TipoSinal = (typeof TIPO_SINAL)[number];
