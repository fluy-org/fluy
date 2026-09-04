export const TIPOS_MIME_IMAGEM_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type TipoMimeImagem = (typeof TIPOS_MIME_IMAGEM_PERMITIDOS)[number];
