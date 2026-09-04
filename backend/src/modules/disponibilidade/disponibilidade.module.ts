import { Module } from '@nestjs/common';
import { DisponibilidadeController } from '@/modules/disponibilidade/disponibilidade.controller';
import { DisponibilidadeRepository } from '@/modules/disponibilidade/disponibilidade.repository';
import { DisponibilidadeService } from '@/modules/disponibilidade/disponibilidade.service';
import { DisponibilidadeValidator } from '@/modules/disponibilidade/disponibilidade.validator';

@Module({
  controllers: [DisponibilidadeController],
  providers: [
    DisponibilidadeRepository,
    DisponibilidadeService,
    DisponibilidadeValidator,
  ],
})
export class DisponibilidadeModule {}
