import { Module } from '@nestjs/common';
import { ArquivoController } from '@/modules/arquivo/arquivo.controller';
import { ArquivoRepository } from '@/modules/arquivo/arquivo.repository';
import { ArquivoService } from '@/modules/arquivo/arquivo.service';
import { ArquivoValidator } from '@/modules/arquivo/arquivo.validator';

@Module({
  controllers: [ArquivoController],
  providers: [ArquivoRepository, ArquivoService, ArquivoValidator],
  exports: [ArquivoService],
})
export class ArquivoModule {}
