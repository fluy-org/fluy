import { Module } from '@nestjs/common';
import { AgendamentoModule } from '@/modules/agendamento/agendamento.module';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import {
  PagamentoFakeController,
  PagamentoPublicoController,
} from '@/modules/pagamento/pagamento.controller';
import { PAYMENT_REPOSITORY } from '@/modules/pagamento/contracts/pagamento-repository.types';
import { PagamentoExpiracaoService } from '@/modules/pagamento/pagamento-expiracao.service';
import { PagamentoRepository } from '@/modules/pagamento/pagamento.repository';
import { PagamentoService } from '@/modules/pagamento/pagamento.service';
import { PagamentoPublicoService } from '@/modules/pagamento/pagamento-publico.service';
import { PagamentoSimulacaoService } from '@/modules/pagamento/pagamento-simulacao.service';
import { SalaoConfiguracaoModule } from '@/modules/salao-configuracao/salao-configuracao.module';

@Module({
  imports: [AgendamentoModule, ClienteModule, SalaoConfiguracaoModule],
  controllers: [PagamentoPublicoController, PagamentoFakeController],
  providers: [
    PagamentoRepository,
    PagamentoService,
    PagamentoPublicoService,
    PagamentoSimulacaoService,
    PagamentoExpiracaoService,
    { provide: PAYMENT_REPOSITORY, useExisting: PagamentoRepository },
  ],
})
export class PagamentoModule {}
