import { LIMITE_SUBDOMINIO } from '@fluy/schema';

const CODIGO_VIOLACAO_UNICIDADE = '23505';

export function ehViolacaoUnicidade(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === CODIGO_VIOLACAO_UNICIDADE
  );
}

export function gerarSugestaoSubdominio(
  subdominio: string,
  numero: number,
): string {
  const sufixo = `-${numero}`;
  const limiteBase = LIMITE_SUBDOMINIO - sufixo.length;
  const base = subdominio.slice(0, limiteBase).replace(/-+$/, '');

  return `${base}${sufixo}`;
}
