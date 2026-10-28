import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  NotificacaoPagamento,
  PaymentProvider,
  RecebedorPix,
} from '@/modules/pagamento/contracts';

type PagamentoFake = {
  externalId: string;
  expiraEm: Date;
  totalClienteCentavos: number;
  notificacao?: NotificacaoPagamento;
};

@Injectable()
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';
  private readonly pagamentos = new Map<string, PagamentoFake>();

  quotePix({
    valorSalaoCentavos,
  }: {
    valorSalaoCentavos: number;
    recebedor: RecebedorPix;
  }) {
    return Promise.resolve({
      valorSalaoCentavos,
      taxaClienteCentavos: 100,
      totalClienteCentavos: valorSalaoCentavos + 100,
    });
  }

  createPixPayment(input: {
    idempotencyKey: string;
    cotacao: {
      valorSalaoCentavos: number;
      taxaClienteCentavos: number;
      totalClienteCentavos: number;
    };
    recebedor: RecebedorPix;
    expiraEm: Date;
  }) {
    let pagamento = this.pagamentos.get(input.idempotencyKey);
    if (!pagamento) {
      pagamento = {
        externalId: randomUUID(),
        expiraEm: input.expiraEm,
        totalClienteCentavos: input.cotacao.totalClienteCentavos,
      };
      this.pagamentos.set(input.idempotencyKey, pagamento);
    }

    return Promise.resolve({
      externalId: pagamento.externalId,
      status: 'pendente' as const,
      instrucaoCliente: null,
    });
  }

  simulate(input: {
    externalPaymentId: string;
    resultado: NotificacaoPagamento['tipo'];
    agora: Date;
  }):
    | NotificacaoPagamento
    | { erro: 'nao_encontrado' | 'encerrado' | 'reserva_expirada' } {
    const pagamento = [...this.pagamentos.values()].find(
      (item) => item.externalId === input.externalPaymentId,
    );

    if (!pagamento) {
      return { erro: 'nao_encontrado' as const };
    }

    if (pagamento.notificacao) {
      if (pagamento.notificacao.tipo !== input.resultado) {
        return { erro: 'encerrado' as const };
      }
      return pagamento.notificacao;
    }

    if (
      input.resultado === 'confirmado' &&
      input.agora.getTime() >= pagamento.expiraEm.getTime()
    ) {
      return { erro: 'reserva_expirada' as const };
    }

    pagamento.notificacao = {
      provider: this.name,
      eventId: randomUUID(),
      externalPaymentId: pagamento.externalId,
      tipo: input.resultado,
      ocorridoEm: input.agora,
      valorPagoCentavos:
        input.resultado === 'confirmado'
          ? pagamento.totalClienteCentavos
          : undefined,
    };
    return pagamento.notificacao;
  }
}
