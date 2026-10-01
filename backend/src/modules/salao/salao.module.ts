import { Module } from '@nestjs/common';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { SalaoPublicoController } from '@/modules/salao/salao-publico.controller';
import { SalaoRepository } from '@/modules/salao/salao.repository';
import { SalaoConfiguracaoModule } from '@/modules/salao-configuracao/salao-configuracao.module';

@Module({
  imports: [SalaoConfiguracaoModule],
  controllers: [SalaoPublicoController],
  providers: [SalaoConsultaService, SalaoRepository],
  exports: [SalaoConsultaService],
})
export class SalaoModule {}
