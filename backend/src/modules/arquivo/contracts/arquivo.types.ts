import type { arquivo } from '@fluy/schema';
import type { TipoMimeImagem } from '@/modules/arquivo/contracts/arquivo.enums';

export const DURACAO_RETENCAO_ARQUIVO_ORFAO_MS = 24 * 60 * 60 * 1000;

export type ArquivoPersistido = typeof arquivo.$inferSelect;

export type ArquivoOrfaoExpirado = Pick<
  ArquivoPersistido,
  'id' | 'url_storage'
>;

export type ArquivoRecebido = {
  buffer: Buffer;
  mimeType: string;
  tamanhoBytes: number;
};

export type CriarArquivoInput = {
  mimeType: string;
  salaoId: string;
  tamanhoBytes: number;
  urlStorage: string;
};

export type BuscarArquivoDoSalaoInput = {
  id: string;
  salaoId: string;
};

export type ValidarArquivoOpcionalDoSalaoInput = {
  arquivoId: string | undefined;
  salaoId: string;
};

export type EnviarArquivoInput = {
  arquivo: ArquivoRecebido | undefined;
  salaoId: string;
};

export type ArquivoValidado = {
  buffer: Buffer;
  mimeType: TipoMimeImagem;
  tamanhoBytes: number;
};
