export type PaginaResultado<T> = {
  itens: T[];
  proximoCursor: string | null;
};

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
