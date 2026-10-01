import { Module } from '@nestjs/common';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { NotaController } from '@/modules/nota/nota.controller';
import { NotaRepository } from '@/modules/nota/nota.repository';
import { NotaService } from '@/modules/nota/nota.service';
import { SalaoModule } from '@/modules/salao/salao.module';

@Module({
  imports: [ClienteModule, SalaoModule],
  controllers: [NotaController],
  providers: [NotaRepository, NotaService],
})
export class NotaModule {}
