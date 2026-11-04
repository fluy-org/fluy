import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type WebhookPagamentoInput,
  type NotificacaoPagamento,
} from '@/modules/pagamento/contracts';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';

@Injectable()
export class PagamentoWebhookService {
  private readonly logger = new Logger(PagamentoWebhookService.name);
  constructor(
    private readonly repository: PagamentoRepository,
    private readonly pagamentos: PagamentoService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}
  async receber(input: WebhookPagamentoInput) {
    if (!this.provider.parseNotification)
      throw new ServiceUnavailableException('Notificações indisponíveis.');
    const notificacao = await this.provider.parseNotification(input);
    if (!notificacao) return;
    if (
      !notificacao.provider?.trim() ||
      notificacao.provider !== this.provider.name
    )
      throw new BadRequestException(
        'Origem da notificação incompatível com o provedor.',
      );
    const registro = await this.repository.registrarNotificacao(notificacao);
    if (registro.status === 'processado') return;
    try {
      await this.processar({ ...notificacao, registroId: registro.id });
    } catch {
      await this.repository.reagendarNotificacao({
        id: registro.id,
        falhou: true,
      });
      this.logger.warn('Notificação persistida aguardando reprocessamento.');
    }
  }
  private async processar(notificacao: NotificacaoPagamento) {
    if (!notificacao.provider?.trim())
      throw new BadRequestException('Informe a origem da notificação.');
    const cobranca = await this.repository.buscarCobrancaDoEvento(notificacao);
    if (!cobranca?.salao_id) {
      if (notificacao.registroId)
        await this.repository.reagendarNotificacao({
          id: notificacao.registroId,
        });
      return;
    }
    await this.pagamentos.processarNotificacao({
      salaoId: cobranca.salao_id,
      notificacao,
    });
  }

  async reprocessar() {
    for (const registro of await this.repository.listarNotificacoesPendentes()) {
      try {
        const payload = registro.payload as Omit<
          NotificacaoPagamento,
          'ocorridoEm'
        > & { ocorridoEm: string };
        await this.processar({
          ...payload,
          ocorridoEm: new Date(payload.ocorridoEm),
          registroId: registro.id,
        });
      } catch {
        await this.repository.reagendarNotificacao({
          id: registro.id,
          falhou: true,
        });
        this.logger.warn('Falha ao reprocessar notificação de pagamento.');
      }
    }
  }
}
