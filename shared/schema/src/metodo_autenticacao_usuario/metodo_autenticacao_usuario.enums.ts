export const TIPO_AUTENTICACAO_USUARIO = ['senha', 'google_oauth'] as const;
export type TipoAutenticacaoUsuario = (typeof TIPO_AUTENTICACAO_USUARIO)[number];
