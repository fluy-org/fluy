import type sharp from 'sharp';
import type { TipoMimeImagem } from '@/modules/arquivo/contracts';

type ConfiguracaoCompressaoImagem = {
  formato: 'jpeg' | 'png' | 'webp';
  opcoes: sharp.JpegOptions | sharp.PngOptions | sharp.WebpOptions;
};

export const LIMITE_TAMANHO_ARQUIVO_RECEBIDO_MIB = 20;
export const LIMITE_TAMANHO_ARQUIVO_PROCESSADO_MIB = 5;
export const LIMITE_TAMANHO_ANEXO_MIB = 5;

export const TAMANHO_MAXIMO_ARQUIVO_RECEBIDO_BYTES =
  LIMITE_TAMANHO_ARQUIVO_RECEBIDO_MIB * 1024 * 1024;
export const TAMANHO_MAXIMO_ARQUIVO_PROCESSADO_BYTES =
  LIMITE_TAMANHO_ARQUIVO_PROCESSADO_MIB * 1024 * 1024;
export const TAMANHO_MAXIMO_ANEXO_BYTES =
  LIMITE_TAMANHO_ANEXO_MIB * 1024 * 1024;

export const LIMITE_MAXIMO_PIXELS_IMAGEM = 50_000_000;
export const LADO_MAXIMO_IMAGEM_PX = 2_000;
export const QUALIDADE_JPEG = 88;
export const QUALIDADE_WEBP = 86;
export const TAMANHO_LOTE_LIMPEZA_ORFAOS = 100;

export const CONFIGURACOES_COMPRESSAO_IMAGEM: Readonly<
  Record<TipoMimeImagem, ConfiguracaoCompressaoImagem>
> = {
  'image/jpeg': {
    formato: 'jpeg',
    opcoes: { quality: QUALIDADE_JPEG, progressive: true },
  },
  'image/png': {
    formato: 'png',
    opcoes: { compressionLevel: 9, adaptiveFiltering: true },
  },
  'image/webp': {
    formato: 'webp',
    opcoes: { quality: QUALIDADE_WEBP, effort: 4 },
  },
};
