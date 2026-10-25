import { alocarPagamento } from '@/modules/pagamento/pagamento-utils';

export function normalizarTipoEvento(tipo: DecidirNotificacaoInput['tipo']) {
  switch (tipo) {
    case 'confirmado':
      return 'cobranca_confirmada' as const;
    case 'expirado':
      return 'expirada' as const;
    case 'falhou':
      return 'falhou' as const;
  }
}

export type DecidirNotificacaoInput = {
  tipo: 'confirmado' | 'falhou' | 'expirado';
  valorPagoCentavos?: number;
  statusCobranca:
    'iniciando' | 'pendente' | 'confirmada' | 'falhou' | 'expirada';
  estadoReserva: string;
  expiraEm: Date | null;
  agora: Date;
  modalidade: 'sinal' | 'total';
  valorSalaoCentavos: number;
  valorSinalCentavos: number;
  totalClienteCentavos: number;
};

export type DecisaoNotificacao = {
  novoStatus: 'iniciando' | 'pendente' | 'confirmada' | 'falhou' | 'expirada';
  promoverReserva: boolean;
  divergencia: boolean;
  alocacoes: Array<{ tipo: 'sinal' | 'restante'; valorCentavos: number }>;
};

export function decidirNotificacao(
  input: DecidirNotificacaoInput,
): DecisaoNotificacao | { erro: 'valor_divergente' } {
  if (
    input.tipo === 'confirmado' &&
    input.valorPagoCentavos !== input.totalClienteCentavos
  )
    return { erro: 'valor_divergente' };
  if (input.statusCobranca === 'confirmada') {
    return {
      novoStatus: 'confirmada' as const,
      promoverReserva: false,
      divergencia: false,
      alocacoes: [],
    };
  }

  if (input.tipo !== 'confirmado') {
    return {
      novoStatus:
        input.tipo === 'falhou' ? ('falhou' as const) : ('expirada' as const),
      promoverReserva: false,
      divergencia: false,
      alocacoes: [],
    };
  }

  const promoverReserva =
    input.estadoReserva === 'reservado' &&
    input.expiraEm !== null &&
    input.expiraEm.getTime() > input.agora.getTime();

  return {
    novoStatus: 'confirmada' as const,
    promoverReserva,
    divergencia: !promoverReserva,
    alocacoes: promoverReserva
      ? alocarPagamento({
          modalidade: input.modalidade,
          valorSalaoCentavos: input.valorSalaoCentavos,
          valorSinalCentavos: input.valorSinalCentavos,
        })
      : [],
  };
}
