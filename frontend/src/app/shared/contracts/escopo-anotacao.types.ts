// A quem uma lista de notas ou lembretes pertence: a ficha da cliente (tudo
// dela) ou o detalhe de um agendamento (só dele).
export type EscopoAnotacao = {
  clienteId: string;
  agendamentoId: string | null;
};
