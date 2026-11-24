import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PagamentoWebhookService } from '@/modules/pagamento/pagamento-webhook.service';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';

@Injectable()
export class PagamentoExpiracaoService {
  private readonly logger = new Logger(PagamentoExpiracaoService.name);

  constructor(
    @Inject(PagamentoRepository)
    private readonly repository: PagamentoRepository,
    private readonly webhook?: PagamentoWebhookService,
    @Optional()
    private readonly pagamento?: PagamentoService,
  ) {}

  private emExecucao = false;

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'expirar-reservas-pix',
    waitForCompletion: true,
  })
  async processarAgendamento() {
    if (this.emExecucao) {
      this.logger.warn(
        'Execução anterior do job de expiração ainda em andamento. Ignorando ciclo.',
      );
      return;
    }
    this.emExecucao = true;
    try {
      await this.processar();
    } catch (error) {
      this.logger.error(error, 'Falha ao expirar reservas Pix.');
    } finally {
      this.emExecucao = false;
    }
  }

  async processar(agora = new Date()) {
    await this.webhook?.reprocessar();
    for (const salao of await this.repository.listarSalaos()) {
      if (this.pagamento) {
        await this.pagamento.reconciliarCobrancasPendentes({
          salaoId: salao.id,
          agora,
        });
      }
      await this.repository.expirarReservasDoSalao({
        salaoId: salao.id,
        agora,
      });
    }
  }
}
