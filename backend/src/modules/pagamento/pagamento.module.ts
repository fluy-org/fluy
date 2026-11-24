import { Module } from '@nestjs/common';
import { AgendamentoModule } from '@/modules/agendamento/agendamento.module';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import {
  PagamentoFakeController,
  PagamentoPublicoController,
  PagamentoRetornoPublicoController,
} from '@/modules/pagamento/pagamento.controller';
import {
  PAYMENT_REPOSITORY,
  AGENDAMENTO_DETALHE_PORT,
  AGENDAMENTO_AVISO_PORT,
} from '@/modules/pagamento/contracts';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';
import { PagamentoExpiracaoService } from '@/modules/pagamento/pagamento-expiracao.service';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';
import { PagamentoWebhookController } from '@/modules/pagamento/pagamento-webhook.controller';
import { PagamentoWebhookService } from '@/modules/pagamento/pagamento-webhook.service';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';
import { PagamentoPublicoService } from '@/modules/pagamento/pagamento-publico.service';
import { PagamentoSimulacaoService } from '@/modules/pagamento/pagamento-simulacao.service';
import { AvisoModule } from '@/modules/aviso/aviso.module';
import { SalaoConfiguracaoModule } from '@/modules/salao-configuracao/salao-configuracao.module';

@Module({
  imports: [
    AgendamentoModule,
    ClienteModule,
    SalaoConfiguracaoModule,
    AvisoModule,
  ],
  controllers: [
    PagamentoPublicoController,
    PagamentoRetornoPublicoController,
    PagamentoFakeController,
    PagamentoWebhookController,
  ],
  providers: [
    PagamentoRepository,
    PagamentoService,
    PagamentoWebhookService,
    PagamentoPublicoService,
    PagamentoSimulacaoService,
    PagamentoExpiracaoService,
    { provide: PAYMENT_REPOSITORY, useExisting: PagamentoRepository },
    { provide: AGENDAMENTO_DETALHE_PORT, useExisting: AgendamentoService },
    { provide: AGENDAMENTO_AVISO_PORT, useExisting: AgendamentoAvisoService },
  ],
})
export class PagamentoModule {}
