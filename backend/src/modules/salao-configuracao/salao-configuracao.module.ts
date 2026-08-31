import { Module } from '@nestjs/common';
import { SalaoConfiguracaoController } from '@/modules/salao-configuracao/salao-configuracao.controller';
import { SalaoConfiguracaoRepository } from '@/modules/salao-configuracao/salao-configuracao.repository';
import { SalaoConfiguracaoService } from '@/modules/salao-configuracao/salao-configuracao.service';
import { SalaoConfiguracaoValidator } from '@/modules/salao-configuracao/salao-configuracao.validator';

@Module({
  controllers: [SalaoConfiguracaoController],
  providers: [
    SalaoConfiguracaoRepository,
    SalaoConfiguracaoService,
    SalaoConfiguracaoValidator,
  ],
})
export class SalaoConfiguracaoModule {}
