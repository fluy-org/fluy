export const PAPEL_USUARIO_SALAO = ['dono', 'funcionario'] as const;
export type PapelUsuarioSalao = (typeof PAPEL_USUARIO_SALAO)[number];
