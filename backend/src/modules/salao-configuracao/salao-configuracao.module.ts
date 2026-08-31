import { Module } from '@nestjs/common';
import { SalaoConfiguracaoController } from './salao-configuracao.controller';
import { SalaoConfiguracaoRepository } from './salao-configuracao.repository';
import { SalaoConfiguracaoService } from './salao-configuracao.service';
import { SalaoConfiguracaoValidator } from './salao-configuracao.validator';

@Module({
  controllers: [SalaoConfiguracaoController],
  providers: [
    SalaoConfiguracaoRepository,
    SalaoConfiguracaoService,
    SalaoConfiguracaoValidator,
  ],
})
export class SalaoConfiguracaoModule {}
