import { Module } from '@nestjs/common';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { LembreteController } from '@/modules/lembrete/lembrete.controller';
import { LembreteRepository } from '@/modules/lembrete/lembrete.repository';
import { LembreteService } from '@/modules/lembrete/lembrete.service';
import { LembreteNotificacaoService } from '@/modules/lembrete/lembrete-notificacao.service';
import { SalaoModule } from '@/modules/salao/salao.module';
import { AvisoModule } from '@/modules/aviso/aviso.module';

@Module({
  imports: [AvisoModule, ClienteModule, SalaoModule],
  controllers: [LembreteController],
  providers: [LembreteNotificacaoService, LembreteRepository, LembreteService],
})
export class LembreteModule {}
