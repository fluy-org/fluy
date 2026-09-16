import { Module } from '@nestjs/common';
import { ClienteController } from '@/modules/cliente/cliente.controller';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import { ClienteService } from '@/modules/cliente/cliente.service';

@Module({
  controllers: [ClienteController],
  providers: [ClienteRepository, ClienteService],
})
export class ClienteModule {}
