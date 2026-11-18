export function ehConflitoUnicidade({
  error,
  constraint,
}: {
  error: unknown;
  constraint: string;
}): boolean {
  const visitados = new Set<object>();
  let atual = error;

  while (typeof atual === 'object' && atual !== null && !visitados.has(atual)) {
    visitados.add(atual);
    const erro = atual as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };

    if (erro.code === '23505' && erro.constraint === constraint) {
      return true;
    }

    atual = erro.cause;
  }

  return false;
}
