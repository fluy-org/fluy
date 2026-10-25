import type { CotacaoPagamento } from '@/modules/pagamento/pagamento-utils';
import type {
  StatusCobrancaGateway,
  ModalidadePagamentoGateway,
} from '@fluy/schema';
import type {
  NotificacaoPagamento,
  RecebedorPix,
  PagadorPix,
} from '@/modules/pagamento/contracts/payment-provider.types';

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');

export type ReservaParaPagamento = {
  id: string;
  salao_id: string;
  cliente_id: string;
  estado: string;
  preco_total: string;
  valor_sinal: string;
  expira_em: Date | null;
};

export type CobrancaParaPagamento = {
  id: string;
  idempotency_key: string;
  provedor: string;
  pagador?: PagadorPix | null;
  criada_em?: Date;
  status: StatusCobrancaGateway;
  modalidade: ModalidadePagamentoGateway;
  valor: string;
  taxa_cliente: string;
  total_cliente: string;
  pix_tipo_chave: RecebedorPix['tipoChave'];
  pix_chave: string;
  pix_nome_recebedor: string;
  id_externo?: string | null;
  divergencia: boolean;
  instrucao_cliente: { tipo: 'url'; valor: string } | null;
};

export type PagamentoConsultado = CobrancaParaPagamento & {
  expira_em: Date | null;
  estado_reserva: string;
};

export interface PagamentoRepositoryPort {
  buscarReserva(input: {
    salaoId: string;
    clienteId: string;
    id: string;
  }): Promise<ReservaParaPagamento | undefined>;
  buscarTentativaAtiva(input: {
    salaoId: string;
    agendamentoId: string;
  }): Promise<CobrancaParaPagamento | undefined>;
  criarOuBuscarTentativa(input: {
    salaoId: string;
    clienteId: string;
    agendamentoId: string;
    modalidade: 'sinal' | 'total';
    idempotencyKey: string;
    provedor: string;
    valorSalaoCentavos: number;
    taxaClienteCentavos: number;
    totalClienteCentavos: number;
    recebedor: RecebedorPix;
    pagador?: PagadorPix;
    agora: Date;
  }): Promise<CobrancaParaPagamento | undefined>;
  marcarPendente(input: {
    salaoId: string;
    cobrancaId: string;
    externalId: string;
    instrucaoCliente: { tipo: 'url'; valor: string } | null;
  }): Promise<CobrancaParaPagamento | undefined>;
  aplicarNotificacao(input: {
    salaoId: string;
    notificacao: NotificacaoPagamento;
    agora: Date;
  }): Promise<'valor_divergente' | undefined>;
  buscarPagamento(input: {
    salaoId: string;
    clienteId: string;
    agendamentoId: string;
  }): Promise<PagamentoConsultado | undefined>;
  buscarCobrancaPorId(input: {
    salaoId: string;
    cobrancaId: string;
  }): Promise<CobrancaParaPagamento | undefined>;
}

export type IniciarPagamentoInput = {
  salaoId: string;
  clienteId: string;
  agendamentoId: string;
  modalidade: 'sinal' | 'total';
  pagador?: PagadorPix;
};

export type CotacaoPersistida = CotacaoPagamento;
