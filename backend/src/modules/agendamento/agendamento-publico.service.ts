import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CriarAgendamentoPublicoDto,
  ListarHorariosLivresPublicosQueryDto,
} from '@fluy/schema';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { ClienteService } from '@/modules/cliente/cliente.service';

@Injectable()
export class AgendamentoPublicoService {
  constructor(
    private readonly agendamentoService: AgendamentoService,
    private readonly clienteService: ClienteService,
  ) {}

  async listarHorariosLivres({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarHorariosLivresPublicosQueryDto;
  }) {
    const cliente = await this.clienteService.resolverSessaoPublica({
      salaoId,
      credencial: dados.credencial,
    });

    if (!cliente) {
      throw new NotFoundException('Sessão da cliente não encontrada.');
    }

    return this.agendamentoService.listarHorariosLivres({
      salaoId,
      dados: {
        procedimento_id: dados.procedimento_id,
        data: dados.data,
      },
    });
  }

  async criar({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: CriarAgendamentoPublicoDto;
  }) {
    const cliente = await this.clienteService.resolverSessaoPublica({
      salaoId,
      credencial: dados.credencial,
    });

    if (!cliente) {
      throw new NotFoundException('Sessão da cliente não encontrada.');
    }

    return this.agendamentoService.criar({
      salaoId,
      bloquearProcedimentoDuplicadoNoDia: true,
      dados: {
        cliente_id: cliente.id,
        procedimento_id: dados.procedimento_id,
        data: dados.data,
        hora_inicio: dados.hora_inicio,
        confirmar_excecoes: dados.confirmar_excecoes,
      },
    });
  }
}
