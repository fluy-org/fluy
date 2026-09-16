import { Module } from '@nestjs/common';
import { SalaoConsultaService } from '@/modules/salao/salao-consulta.service';
import { SalaoRepository } from '@/modules/salao/salao.repository';

@Module({
  providers: [SalaoConsultaService, SalaoRepository],
  exports: [SalaoConsultaService],
})
export class SalaoModule {}
