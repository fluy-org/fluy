import { Module } from '@nestjs/common';
import { FaturamentoController } from '@/modules/faturamento/faturamento.controller';
import { FaturamentoRepository } from '@/modules/faturamento/faturamento.repository';
import { FaturamentoService } from '@/modules/faturamento/faturamento.service';
import { SalaoModule } from '@/modules/salao/salao.module';

@Module({
  imports: [SalaoModule],
  controllers: [FaturamentoController],
  providers: [FaturamentoRepository, FaturamentoService],
})
export class FaturamentoModule {}
