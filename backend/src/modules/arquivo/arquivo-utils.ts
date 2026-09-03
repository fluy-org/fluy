import {
  TIPOS_MIME_IMAGEM_PERMITIDOS,
  type TipoMimeImagem,
} from '@/modules/arquivo/contracts';

export function ehTipoMimeImagem(mimeType: string): mimeType is TipoMimeImagem {
  return TIPOS_MIME_IMAGEM_PERMITIDOS.some((tipoMime) => tipoMime === mimeType);
}
