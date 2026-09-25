import { Module } from '@nestjs/common';
import { ClienteController } from '@/modules/cliente/cliente.controller';
import { ClientePublicoController } from '@/modules/cliente/cliente-publico.controller';
import { ClienteRepository } from '@/modules/cliente/cliente.repository';
import { ClienteService } from '@/modules/cliente/cliente.service';

@Module({
  controllers: [ClienteController, ClientePublicoController],
  providers: [ClienteRepository, ClienteService],
  exports: [ClienteService],
})
export class ClienteModule {}
