import type {
  CotacaoPagamento,
  DecidirNotificacaoInput,
  DecisaoNotificacao,
} from '@/modules/pagamento/contracts';
import type {
  InstrucaoPagamentoPixDto,
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
  instrucao_cliente: InstrucaoPagamentoPixDto;
};

export type PagamentoConsultado = CobrancaParaPagamento & {
  expira_em: Date | null;
  estado_reserva: string;
};

export type ResultadoAplicacaoNotificacao =
  | 'valor_divergente'
  | { resultado: 'promovido'; agendamentoId: string }
  | { resultado: 'confirmado_apos_expiracao'; agendamentoId: string }
  | { resultado: 'processado'; agendamentoId: string }
  | undefined;

export type CobrancaPendenteReconciliacao = {
  id: string;
  id_externo: string | null;
  criada_em?: Date;
  agendamento_id: string | null;
  provedor: string;
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
    modalidade: ModalidadePagamentoGateway;
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
    instrucaoCliente: InstrucaoPagamentoPixDto;
  }): Promise<CobrancaParaPagamento | undefined>;
  aplicarNotificacao(
    input: AplicarNotificacaoPagamentoPersistenciaInput,
  ): Promise<ResultadoAplicacaoNotificacao>;
  buscarPagamento(input: {
    salaoId: string;
    clienteId: string;
    agendamentoId: string;
  }): Promise<PagamentoConsultado | undefined>;
  buscarCobrancaPorId(input: {
    salaoId: string;
    cobrancaId: string;
  }): Promise<CobrancaParaPagamento | undefined>;
  listarCobrancasPendentesParaReconciliacao?(input: {
    salaoId: string;
    agora: Date;
  }): Promise<CobrancaPendenteReconciliacao[]>;
  buscarRetornoPorIdentificador?(input: {
    identificadorPagamento: string;
    provedor?: string;
  }): Promise<{
    encontrado: boolean;
    reserva_id?: string;
    status?: StatusCobrancaGateway;
    procedimento?: {
      nome: string;
    };
    salao?: {
      nome: string;
      subdominio: string;
    };
  }>;
}

export type IniciarPagamentoInput = {
  salaoId: string;
  clienteId: string;
  agendamentoId: string;
  modalidade: ModalidadePagamentoGateway;
  pagador?: PagadorPix;
};

export type CotacaoPersistida = CotacaoPagamento;

export type AplicarNotificacaoPagamentoPersistenciaInput = {
  salaoId: string;
  notificacao: NotificacaoPagamento;
  agora: Date;
  decidir: (
    input: Readonly<DecidirNotificacaoInput>,
  ) => DecisaoNotificacao | { erro: 'valor_divergente' };
};
