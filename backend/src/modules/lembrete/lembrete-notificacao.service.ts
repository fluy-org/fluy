import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AvisoService } from '@/modules/aviso/aviso.service';
import { LembreteRepository } from '@/modules/lembrete/lembrete.repository';
import type { LembreteVencidoPersistido } from '@/modules/lembrete/contracts';

const LIMITE_LEMBRETES_POR_CICLO = 100;

@Injectable()
export class LembreteNotificacaoService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LembreteNotificacaoService.name);

  constructor(
    private readonly lembreteRepository: LembreteRepository,
    private readonly avisoService: AvisoService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.processarComSeguranca();
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'notificar-lembretes-vencidos',
    waitForCompletion: true,
  })
  async processarAgendamento(): Promise<void> {
    await this.processarComSeguranca();
  }

  async processarVencidosDoSalao(salaoId: string): Promise<void> {
    await this.processarComSeguranca(salaoId);
  }

  async processar({ salaoId }: { salaoId?: string } = {}): Promise<void> {
    const lembretes =
      await this.lembreteRepository.listarVencidosParaNotificacao({
        salaoId,
        limite: LIMITE_LEMBRETES_POR_CICLO,
      });

    for (const lembrete of lembretes) {
      await this.notificar(lembrete);
    }
  }

  private async notificar(lembrete: LembreteVencidoPersistido): Promise<void> {
    await this.avisoService.criarParaSalao({
      salaoId: lembrete.salaoId,
      lembreteId: lembrete.id,
      tipo: 'lembrete_vencido',
      titulo: `Lembrete de ${lembrete.cliente.nome}`,
      mensagem: lembrete.texto,
    });
    await this.lembreteRepository.marcarNotificado({
      id: lembrete.id,
      salaoId: lembrete.salaoId,
      notificadoEm: new Date(),
    });
  }

  private async processarComSeguranca(salaoId?: string): Promise<void> {
    try {
      await this.processar({ salaoId });
    } catch (erro) {
      this.logger.error('Falha ao processar lembretes vencidos.', erro);
    }
  }
}
