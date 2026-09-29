import type { EscopoAnotacao } from '../contracts';

// O cursor carrega offset: se a lista mudou entre as páginas, a próxima pode
// repetir item já carregado.
export function acumularPagina<T extends { id: string }>({
  itens,
  novos,
}: {
  itens: T[];
  novos: T[];
}): T[] {
  const idsCarregados = new Set(itens.map((item) => item.id));

  return [...itens, ...novos.filter((item) => !idsCarregados.has(item.id))];
}

// Cada escopo tem sua própria lista no service: telas diferentes na pilha do
// Ionic (ficha, detalhes de agendamentos distintos) não sobrescrevem uma à outra.
export function chaveDoEscopo({
  clienteId,
  agendamentoId,
}: EscopoAnotacao): string {
  return agendamentoId ? `agendamento:${agendamentoId}` : `cliente:${clienteId}`;
}
