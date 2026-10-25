import type { CotacaoPagamento } from '@/modules/pagamento/pagamento-utils';
import type { ResultadoSimulacaoPagamento, TipoChavePix } from '@fluy/schema';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export type RecebedorPix = {
  tipoChave: TipoChavePix;
  chave: string;
  nomeRecebedor: string;
};

export type PagadorPix = { cpf: string; instituicao_id: string; cnpj?: string };
export type InstituicaoPix = { id: string; nome: string };
export type WebhookPagamentoInput = {
  body: unknown;
  rawBody?: Uint8Array;
  headers: Readonly<Record<string, string | string[] | undefined>>;
  query: Readonly<Record<string, unknown>>;
};

export interface PaymentProvider {
  readonly name: string;
  readonly requiresPayer?: boolean;
  listPixParticipants?(): Promise<InstituicaoPix[]>;
  getPixPayment?(input: {
    externalId: string;
    createdAt: Date;
  }): Promise<NotificacaoPagamento | null>;
  parseNotification?(
    input: WebhookPagamentoInput,
  ): NotificacaoPagamento | null | Promise<NotificacaoPagamento | null>;
  quotePix(input: {
    valorSalaoCentavos: number;
    recebedor: RecebedorPix;
  }): Promise<CotacaoPagamento>;
  createPixPayment(input: {
    idempotencyKey: string;
    cotacao: CotacaoPagamento;
    recebedor: RecebedorPix;
    expiraEm: Date;
    pagador?: PagadorPix;
  }): Promise<{
    externalId: string;
    status: 'pendente';
    instrucaoCliente: { tipo: 'url'; valor: string } | null;
  }>;
}

export type NotificacaoPagamento = {
  eventId: string;
  tipoBruto?: string;
  registroId?: string;
  provider: string;
  reference?: string;
  externalPaymentId: string;
  tipo: ResultadoSimulacaoPagamento;
  ocorridoEm: Date;
  valorPagoCentavos?: number;
};
