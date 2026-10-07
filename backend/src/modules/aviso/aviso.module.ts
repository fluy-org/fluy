import { Module } from '@nestjs/common';
import { AvisoController } from '@/modules/aviso/aviso.controller';
import { AvisoPublicoController } from '@/modules/aviso/aviso-publico.controller';
import { AvisoRepository } from '@/modules/aviso/aviso.repository';
import { AvisoService } from '@/modules/aviso/aviso.service';
import { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';
import { CalendarioIcsService } from '@/modules/aviso/calendario-ics.service';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { SalaoModule } from '@/modules/salao/salao.module';

@Module({
  imports: [ClienteModule, SalaoModule],
  controllers: [AvisoController, AvisoPublicoController],
  providers: [
    AgendamentoAvisoService,
    AvisoRepository,
    AvisoService,
    CalendarioIcsService,
  ],
  exports: [AgendamentoAvisoService, AvisoService, CalendarioIcsService],
})
export class AvisoModule {}
