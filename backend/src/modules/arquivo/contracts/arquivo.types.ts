import type { arquivo } from '@fluy/schema';

export const TAMANHO_MAXIMO_ARQUIVO_BYTES = 5 * 1024 * 1024;
export const DURACAO_RETENCAO_ARQUIVO_ORFAO_MS = 24 * 60 * 60 * 1000;

export type ArquivoPersistido = typeof arquivo.$inferSelect;

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
  mimeType: string;
  tamanhoBytes: number;
};
