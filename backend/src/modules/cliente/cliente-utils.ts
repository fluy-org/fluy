import type { PaginaResultado } from '@/modules/cliente/contracts';

// O cursor é opaco para quem consome a API: hoje carrega o offset, mas pode
// passar a carregar a chave de ordenação (keyset) sem mudar o contrato.
export function codificarCursorPagina({ offset }: { offset: number }): string {
  return Buffer.from(offset.toString()).toString('base64url');
}

export function decodificarCursorPagina({
  cursor,
}: {
  cursor: string;
}): number | undefined {
  const conteudo = Buffer.from(cursor, 'base64url').toString();

  if (!/^\d+$/.test(conteudo)) {
    return undefined;
  }

  const offset = Number(conteudo);

  return Number.isSafeInteger(offset) ? offset : undefined;
}

export function montarPagina<T>({
  linhas,
  offset,
  tamanho,
}: {
  linhas: T[];
  offset: number;
  tamanho: number;
}): PaginaResultado<T> {
  const temProxima = linhas.length > tamanho;

  return {
    itens: linhas.slice(0, tamanho),
    proximoCursor: temProxima
      ? codificarCursorPagina({ offset: offset + tamanho })
      : null,
  };
}

export function montarPadraoBuscaNome({ termo }: { termo: string }): string {
  return `%${termo.replace(/[\\%_]/g, '\\$&')}%`;
}

export function extrairDigitos({ termo }: { termo: string }): string {
  return termo.replace(/\D/g, '');
}
