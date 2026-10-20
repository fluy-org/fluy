import { Module } from '@nestjs/common';
import { SalaoConfiguracaoController } from '@/modules/salao-configuracao/salao-configuracao.controller';
import { SalaoConfiguracaoRepository } from '@/modules/salao-configuracao/salao-configuracao.repository';
import { SalaoConfiguracaoService } from '@/modules/salao-configuracao/salao-configuracao.service';
import { SalaoConfiguracaoValidator } from '@/modules/salao-configuracao/salao-configuracao.validator';
import { RecebimentoPixController } from '@/modules/salao-configuracao/recebimento-pix.controller';
import { RecebimentoPixRepository } from '@/modules/salao-configuracao/recebimento-pix.repository';
import { RecebimentoPixService } from '@/modules/salao-configuracao/recebimento-pix.service';

@Module({
  controllers: [SalaoConfiguracaoController, RecebimentoPixController],
  providers: [
    SalaoConfiguracaoRepository,
    SalaoConfiguracaoService,
    SalaoConfiguracaoValidator,
    RecebimentoPixRepository,
    RecebimentoPixService,
  ],
  exports: [SalaoConfiguracaoService, RecebimentoPixService],
})
export class SalaoConfiguracaoModule {}
