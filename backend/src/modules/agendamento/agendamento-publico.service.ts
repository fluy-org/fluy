import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CancelarAgendamentoPublicoDto,
  ConsultarAgendamentoPublicoQueryDto,
  CriarAgendamentoPublicoDto,
  ListarAgendamentosPublicosQueryDto,
  ListarHorariosLivresPublicosQueryDto,
} from '@fluy/schema';
import { AgendamentoCancelamentoService } from '@/modules/agendamento/agendamento-cancelamento.service';
import { AgendamentoService } from '@/modules/agendamento/agendamento.service';
import { ClienteService } from '@/modules/cliente/cliente.service';

@Injectable()
export class AgendamentoPublicoService {
  constructor(
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoCancelamentoService: AgendamentoCancelamentoService,
    private readonly clienteService: ClienteService,
  ) {}

  async listar({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarAgendamentosPublicosQueryDto;
  }) {
    const cliente = await this.resolverCliente({
      salaoId,
      credencial: dados.credencial,
    });

    return this.clienteService.listarAgendamentos({
      id: cliente.id,
      salaoId,
      cursor: dados.cursor,
    });
  }

  async buscarDetalhe({
    id,
    salaoId,
    dados,
  }: {
    id: string;
    salaoId: string;
    dados: ConsultarAgendamentoPublicoQueryDto;
  }) {
    const cliente = await this.resolverCliente({
      salaoId,
      credencial: dados.credencial,
    });
    const agendamento = await this.agendamentoService.buscarDetalhe({
      id,
      salaoId,
    });

    if (agendamento.cliente.id !== cliente.id) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    return agendamento;
  }

  async cancelar({
    id,
    salaoId,
    dados,
  }: {
    id: string;
    salaoId: string;
    dados: CancelarAgendamentoPublicoDto;
  }) {
    const agendamento = await this.buscarDetalhe({ id, salaoId, dados });

    if (agendamento.estado !== 'agendado') {
      throw new ConflictException('Este agendamento não pode ser cancelado.');
    }

    return this.agendamentoCancelamentoService.cancelar({
      id,
      salaoId,
      dados: { motivo: 'Cancelado pela cliente.' },
    });
  }

  async listarHorariosLivres({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarHorariosLivresPublicosQueryDto;
  }) {
    await this.resolverCliente({
      salaoId,
      credencial: dados.credencial,
    });

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
    const cliente = await this.resolverCliente({
      salaoId,
      credencial: dados.credencial,
    });

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

  private async resolverCliente({
    salaoId,
    credencial,
  }: {
    salaoId: string;
    credencial: string;
  }) {
    const cliente = await this.clienteService.resolverSessaoPublica({
      salaoId,
      credencial,
    });

    if (!cliente) {
      throw new NotFoundException('Sessão da cliente não encontrada.');
    }

    return cliente;
  }
}
