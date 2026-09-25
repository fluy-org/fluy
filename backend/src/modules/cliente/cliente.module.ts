import { Module } from '@nestjs/common';
import { ClienteController } from '@/modules/cliente/cliente.controller';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import { ClienteService } from '@/modules/cliente/cliente.service';
import { SalaoModule } from '@/modules/salao/salao.module';

@Module({
  imports: [SalaoModule],
  controllers: [ClienteController],
  providers: [ClienteRepository, ClienteService],
  exports: [ClienteService],
})
export class ClienteModule {}
