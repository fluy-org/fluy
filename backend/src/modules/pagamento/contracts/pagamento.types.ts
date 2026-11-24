import type {
  ModalidadePagamentoGateway,
  StatusCobrancaGateway,
  TipoPagamentoAgendamento,
} from '@fluy/schema';
import type { NotificacaoPagamento } from '@/modules/pagamento/contracts/payment-provider.types';
import type { AgendamentoDetalheResultado } from '@/modules/agendamento/contracts';
import type { AvisoPersistido } from '@/modules/aviso/contracts';

export type CotacaoPagamento = {
  valorSalaoCentavos: number;
  taxaClienteCentavos: number;
  totalClienteCentavos: number;
};

export type DecidirNotificacaoInput = {
  tipo: NotificacaoPagamento['tipo'];
  valorPagoCentavos?: number;
  statusCobranca: StatusCobrancaGateway;
  estadoReserva: string;
  expiraEm: Date | null;
  agora: Date;
  ocorridoEm?: Date;
  modalidade: ModalidadePagamentoGateway;
  valorSalaoCentavos: number;
  valorSinalCentavos: number;
  totalClienteCentavos: number;
};

export type DecisaoNotificacao = {
  novoStatus: StatusCobrancaGateway;
  promoverReserva: boolean;
  divergencia: boolean;
  alocacoes: Array<{ tipo: TipoPagamentoAgendamento; valorCentavos: number }>;
};

export const AGENDAMENTO_DETALHE_PORT = Symbol('AGENDAMENTO_DETALHE_PORT');
export const AGENDAMENTO_AVISO_PORT = Symbol('AGENDAMENTO_AVISO_PORT');

export interface AgendamentoDetalhePort {
  buscarDetalhe(input: {
    id: string;
    salaoId: string;
  }): Promise<AgendamentoDetalheResultado | undefined>;
}

export interface AgendamentoAvisoPort {
  notificarAgendamentoPagoConfirmado(
    agendamento: AgendamentoDetalheResultado,
  ): Promise<AvisoPersistido[]>;
  notificarPagamentoAposPrazo(
    agendamento: AgendamentoDetalheResultado,
  ): Promise<AvisoPersistido[]>;
}
