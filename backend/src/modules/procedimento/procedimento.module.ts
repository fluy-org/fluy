import { Module } from '@nestjs/common';
import { ArquivoModule } from '@/modules/arquivo/arquivo.module';
import { ProcedimentoController } from '@/modules/procedimento/procedimento.controller';
import { ProcedimentoPublicoController } from '@/modules/procedimento/procedimento-publico.controller';
import { ProcedimentoRepository } from '@/modules/procedimento/procedimento.repository';
import { ProcedimentoService } from '@/modules/procedimento/procedimento.service';
import { ProcedimentoValidator } from '@/modules/procedimento/procedimento.validator';

@Module({
  imports: [ArquivoModule],
  controllers: [ProcedimentoController, ProcedimentoPublicoController],
  providers: [
    ProcedimentoRepository,
    ProcedimentoService,
    ProcedimentoValidator,
  ],
})
export class ProcedimentoModule {}
