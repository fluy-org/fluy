import { Module } from '@nestjs/common';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { LembreteController } from '@/modules/lembrete/lembrete.controller';
import { LembreteRepository } from '@/modules/lembrete/lembrete.repository';
import { LembreteService } from '@/modules/lembrete/lembrete.service';
import { SalaoModule } from '@/modules/salao/salao.module';

@Module({
  imports: [ClienteModule, SalaoModule],
  controllers: [LembreteController],
  providers: [LembreteRepository, LembreteService],
})
export class LembreteModule {}
