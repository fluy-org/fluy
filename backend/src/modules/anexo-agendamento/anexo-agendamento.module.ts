import { Module } from '@nestjs/common';
import { AnexoAgendamentoController } from '@/modules/anexo-agendamento/anexo-agendamento.controller';
import { AnexoAgendamentoRepository } from '@/modules/anexo-agendamento/anexo-agendamento.repository';
import { AnexoAgendamentoService } from '@/modules/anexo-agendamento/anexo-agendamento.service';
import { ArquivoModule } from '@/modules/arquivo/arquivo.module';
import { ClienteModule } from '@/modules/cliente/cliente.module';
import { AnexoAgendamentoPublicoController } from '@/modules/anexo-agendamento/anexo-agendamento-publico.controller';
import { AnexoClienteController } from '@/modules/anexo-agendamento/anexo-cliente.controller';

@Module({
  imports: [ArquivoModule, ClienteModule],
  controllers: [
    AnexoAgendamentoController,
    AnexoAgendamentoPublicoController,
    AnexoClienteController,
  ],
  providers: [AnexoAgendamentoRepository, AnexoAgendamentoService],
  exports: [AnexoAgendamentoService],
})
export class AnexoAgendamentoModule {}
