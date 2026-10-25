import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PagamentoWebhookService } from './pagamento-webhook.service';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';

@Injectable()
export class PagamentoExpiracaoService {
  private readonly logger = new Logger(PagamentoExpiracaoService.name);

  constructor(
    @Inject(PagamentoRepository)
    private readonly repository: PagamentoRepository,
    private readonly webhook?: PagamentoWebhookService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'expirar-reservas-pix',
    waitForCompletion: true,
  })
  async processarAgendamento() {
    try {
      await this.processar();
    } catch (error) {
      this.logger.error(error, 'Falha ao expirar reservas Pix.');
    }
  }

  async processar(agora = new Date()) {
    await this.webhook?.reprocessar();
    for (const salao of await this.repository.listarSalaos()) {
      await this.repository.expirarReservasDoSalao({
        salaoId: salao.id,
        agora,
      });
    }
  }
}
