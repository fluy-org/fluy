import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type { NotificacaoPagamento } from '@/modules/pagamento/contracts';
import {
  PAYMENT_REPOSITORY,
  type PagamentoRepositoryPort,
} from '@/modules/pagamento/contracts';
import {
  PAYMENT_SIMULATOR,
  type PaymentSimulator,
} from '@/modules/pagamento/contracts';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';

@Injectable()
export class PagamentoSimulacaoService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    @Inject(PAYMENT_REPOSITORY)
    private readonly repository: PagamentoRepositoryPort,
    @Inject(PAYMENT_SIMULATOR) private readonly simulator: PaymentSimulator,
    private readonly pagamento: PagamentoService,
  ) {}

  async simular(input: {
    salaoId: string;
    cobrancaId: string;
    resultado: NotificacaoPagamento['tipo'];
  }) {
    if (
      this.config.get('NODE_ENV', { infer: true }) !== 'development' ||
      this.config.get('PAYMENT_PROVIDER', { infer: true }) !== 'fake'
    ) {
      throw new ServiceUnavailableException('Simulação indisponível.');
    }

    const cobranca = await this.repository.buscarCobrancaPorId(input);
    if (!cobranca?.id_externo)
      throw new NotFoundException('Cobrança não encontrada.');

    const agora = new Date();
    const notificacao = this.simulator.simulate({
      externalPaymentId: cobranca.id_externo,
      resultado: input.resultado,
      agora,
    });
    if ('erro' in notificacao) {
      const mensagens = {
        nao_encontrado: 'Pagamento fake não encontrado.',
        encerrado: 'Pagamento fake já encerrado.',
        reserva_expirada: 'A reserva expirou.',
      };
      throw new BadRequestException(mensagens[notificacao.erro]);
    }
    await this.pagamento.processarNotificacao({
      salaoId: input.salaoId,
      notificacao,
      agora,
    });
  }
}
