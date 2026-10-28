import type {
  ModalidadePagamentoGateway,
  StatusCobrancaGateway,
  TipoPagamentoAgendamento,
} from '@fluy/schema';
import type { NotificacaoPagamento } from '@/modules/pagamento/contracts/payment-provider.types';

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
