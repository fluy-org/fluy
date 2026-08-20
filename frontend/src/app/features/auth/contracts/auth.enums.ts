export const TIPO_ERRO_CONCLUSAO_CADASTRO = [
  'conflito_email',
  'perfil_incompleto',
  'temporario',
] as const;

export type TipoErroConclusaoCadastro =
  (typeof TIPO_ERRO_CONCLUSAO_CADASTRO)[number];
