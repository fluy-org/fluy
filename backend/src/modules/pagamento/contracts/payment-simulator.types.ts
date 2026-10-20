import type { NotificacaoPagamento } from '@/modules/pagamento/contracts/payment-provider.types';

export const PAYMENT_SIMULATOR = Symbol('PAYMENT_SIMULATOR');

export interface PaymentSimulator {
  simulate(input: {
    externalPaymentId: string;
    resultado: NotificacaoPagamento['tipo'];
    agora: Date;
  }):
    | NotificacaoPagamento
    | { erro: 'nao_encontrado' | 'encerrado' | 'reserva_expirada' };
}
