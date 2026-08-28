import { Module } from '@nestjs/common';
import { ProcedimentoController } from './procedimento.controller';
import { ProcedimentoPublicoController } from './procedimento-publico.controller';
import { ProcedimentoRepository } from './procedimento.repository';
import { ProcedimentoService } from './procedimento.service';
import { ProcedimentoValidator } from './procedimento.validator';

@Module({
  controllers: [ProcedimentoController, ProcedimentoPublicoController],
  providers: [
    ProcedimentoRepository,
    ProcedimentoService,
    ProcedimentoValidator,
  ],
})
export class ProcedimentoModule {}
