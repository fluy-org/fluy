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
import { AgendamentoAvisoService } from '@/modules/aviso/agendamento-aviso.service';
import { CalendarioIcsService } from '@/modules/aviso/calendario-ics.service';

@Injectable()
export class AgendamentoPublicoService {
  constructor(
    private readonly agendamentoService: AgendamentoService,
    private readonly agendamentoCancelamentoService: AgendamentoCancelamentoService,
    private readonly clienteService: ClienteService,
    private readonly calendarioIcsService: CalendarioIcsService,
    private readonly agendamentoAvisoService: AgendamentoAvisoService,
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

  async gerarCalendario({
    id,
    salaoId,
    dados,
  }: {
    id: string;
    salaoId: string;
    dados: ConsultarAgendamentoPublicoQueryDto;
  }) {
    const agendamento = await this.buscarDetalhe({ id, salaoId, dados });

    return this.calendarioIcsService.gerar(agendamento);
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

    const cancelado = await this.agendamentoCancelamentoService.cancelar({
      id,
      salaoId,
      dados: { motivo: 'Cancelado pela cliente.' },
      notificarCliente: false,
    });

    await this.agendamentoAvisoService.notificarCancelamentoPelaCliente(
      cancelado,
    );

    return cancelado;
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

    const criado = await this.agendamentoService.criar({
      salaoId,
      bloquearProcedimentoDuplicadoNoDia: true,
      notificarCliente: false,
      dados: {
        cliente_id: cliente.id,
        procedimento_id: dados.procedimento_id,
        data: dados.data,
        hora_inicio: dados.hora_inicio,
        confirmar_excecoes: dados.confirmar_excecoes,
      },
    });

    await this.agendamentoAvisoService.notificarCriacaoPublica(
      await this.agendamentoService.buscarDetalhe({
        id: criado.id,
        salaoId,
      }),
    );

    return criado;
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
