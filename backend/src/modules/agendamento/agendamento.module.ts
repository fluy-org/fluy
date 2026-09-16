import { Module } from '@nestjs/common';
import { AgendamentoDisponibilidadeService } from '@/modules/agendamento/agendamento-disponibilidade.service';
import { AgendamentoController } from '@/modules/agendamento/agendamento.controller';
import { AgendamentoRepository } from '@/modules/agendamento/agendamento.repository';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { AgendamentoValidator } from '@/modules/agendamento/agendamento.validator';
import { DisponibilidadeModule } from '@/modules/disponibilidade/disponibilidade.module';
import { ProcedimentoModule } from '@/modules/procedimento/procedimento.module';
import { SalaoConfiguracaoModule } from '@/modules/salao-configuracao/salao-configuracao.module';
import { SalaoModule } from '@/modules/salao/salao.module';

@Module({
  imports: [
    DisponibilidadeModule,
    ProcedimentoModule,
    SalaoConfiguracaoModule,
    SalaoModule,
  ],
  controllers: [AgendamentoController],
  providers: [
    AgendamentoDisponibilidadeService,
    AgendamentoRepository,
    AgendamentoService,
    AgendamentoValidator,
  ],
})
export class AgendamentoModule {}
