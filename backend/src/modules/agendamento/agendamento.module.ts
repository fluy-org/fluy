import { Module } from '@nestjs/common';
import { AgendamentoCancelamentoService } from '@/modules/agendamento/agendamento-cancelamento.service';
import { AgendamentoConclusaoService } from '@/modules/agendamento/agendamento-conclusao.service';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';
import { AgendamentoFaltaService } from '@/modules/agendamento/agendamento-falta.service';
import { AgendamentoRemarcacaoService } from '@/modules/agendamento/agendamento-remarcacao.service';
import { AgendamentoController } from '@/modules/agendamento/agendamento.controller';
import { AgendamentoPublicoController } from '@/modules/agendamento/agendamento-publico.controller';
import { AgendamentoPublicoService } from '@/modules/agendamento/agendamento-publico.service';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import { DisponibilidadeModule } from '@/modules/disponibilidade/disponibilidade.module';
import { ProcedimentoModule } from '@/modules/procedimento/procedimento.module';
import { SalaoConfiguracaoModule } from '@/modules/salao-configuracao/salao-configuracao.module';
import { SalaoModule } from '@/modules/salao/salao.module';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { AvisoModule } from '@/modules/aviso/aviso.module';

@Module({
  imports: [
    ClienteModule,
    AvisoModule,
    DisponibilidadeModule,
    ProcedimentoModule,
    SalaoConfiguracaoModule,
    SalaoModule,
  ],
  controllers: [AgendamentoController, AgendamentoPublicoController],
  providers: [
    AgendamentoCancelamentoService,
    AgendamentoConclusaoService,
    AgendamentoDisponibilidadeService,
    AgendamentoFaltaService,
    AgendamentoRemarcacaoService,
    AgendamentoRepository,
    AgendamentoPublicoService,
    AgendamentoService,
    AgendamentoValidator,
  ],
  // O cancelamento é reusado pelo Bloco 4 na versão da cliente, com política de
  // autorização diferente.
  exports: [AgendamentoCancelamentoService],
})
export class AgendamentoModule {}
