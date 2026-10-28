import type {
  ModalidadePagamentoGateway,
  TipoPagamentoAgendamento,
} from '@fluy/schema';
import type { CotacaoPagamento } from '@/modules/pagamento/contracts';
import { createHash } from 'node:crypto';

export function chaveIdempotenciaEvento(input: {
  salaoId: string;
  eventoId: string;
}): string {
  return createHash('sha256')
    .update(input.salaoId)
    .update('\0')
    .update(input.eventoId)
    .digest('hex');
}

export function validarCotacao(cotacao: CotacaoPagamento): boolean {
  const valores = Object.values(cotacao);

  return !(
    valores.some((valor) => !Number.isSafeInteger(valor) || valor < 0) ||
    cotacao.valorSalaoCentavos + cotacao.taxaClienteCentavos !==
      cotacao.totalClienteCentavos
  );
}

export function alocarPagamento({
  modalidade,
  valorSalaoCentavos,
  valorSinalCentavos,
}: {
  modalidade: ModalidadePagamentoGateway;
  valorSalaoCentavos: number;
  valorSinalCentavos: number;
}): Array<{ tipo: TipoPagamentoAgendamento; valorCentavos: number }> {
  if (modalidade === 'sinal') {
    return valorSalaoCentavos > 0
      ? [{ tipo: 'sinal', valorCentavos: valorSalaoCentavos }]
      : [];
  }

  const alocacoes: Array<{
    tipo: TipoPagamentoAgendamento;
    valorCentavos: number;
  }> = [];

  if (valorSinalCentavos > 0) {
    alocacoes.push({ tipo: 'sinal', valorCentavos: valorSinalCentavos });
  }

  const restante = valorSalaoCentavos - valorSinalCentavos;
  if (restante > 0) {
    alocacoes.push({ tipo: 'restante', valorCentavos: restante });
  }

  return alocacoes;
}
