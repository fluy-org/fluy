import type { CotacaoPagamento } from '@/modules/pagamento/pagamento-utils';
import type { ResultadoSimulacaoPagamento, TipoChavePix } from '@fluy/schema';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export type RecebedorPix = {
  tipoChave: TipoChavePix;
  chave: string;
  nomeRecebedor: string;
};

export interface PaymentProvider {
  quotePix(input: {
    valorSalaoCentavos: number;
    recebedor: RecebedorPix;
  }): Promise<CotacaoPagamento>;
  createPixPayment(input: {
    idempotencyKey: string;
    cotacao: CotacaoPagamento;
    recebedor: RecebedorPix;
    expiraEm: Date;
  }): Promise<{
    externalId: string;
    status: 'pendente';
    instrucaoCliente: { tipo: 'url'; valor: string } | null;
  }>;
}

export type NotificacaoPagamento = {
  eventId: string;
  externalPaymentId: string;
  tipo: ResultadoSimulacaoPagamento;
  ocorridoEm: Date;
  valorPagoCentavos?: number;
};
