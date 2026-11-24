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
  ListarDiasDisponiveisPublicosQueryDto,
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
    const sessaoPublica = await this.resolverSessao({
      salaoId,
      credencial: dados.credencial,
    });
    const clienteId = sessaoPublica.cliente?.id ?? (sessaoPublica as any).id;
    const sessaoId = sessaoPublica.sessao?.id;
    const verificada = sessaoPublica.verificada !== false;

    return this.clienteService.listarAgendamentos({
      id: clienteId,
      salaoId,
      cursor: dados.cursor,
      sessaoClienteId: verificada ? undefined : sessaoId,
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
    const sessaoPublica = await this.resolverSessao({
      salaoId,
      credencial: dados.credencial,
    });
    const clienteId = sessaoPublica.cliente?.id ?? (sessaoPublica as any).id;
    const sessaoId = sessaoPublica.sessao?.id;
    const verificada = sessaoPublica.verificada !== false;

    const agendamento = await this.agendamentoService.buscarDetalhe({
      id,
      salaoId,
    });

    if (agendamento.cliente.id !== clienteId) {
      throw new NotFoundException('Agendamento não encontrado.');
    }

    if (!verificada && sessaoId && agendamento.sessao_cliente_id !== sessaoId) {
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
      canceladoPor: 'cliente',
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
    if (dados.credencial) {
      await this.resolverCliente({
        salaoId,
        credencial: dados.credencial,
      });
    }

    return this.agendamentoService.listarHorariosLivres({
      salaoId,
      dados: {
        procedimento_id: dados.procedimento_id,
        data: dados.data,
      },
      apenasDisponiveis: true,
      bloquearInicioPassado: true,
    });
  }

  async listarDiasDisponiveis({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: ListarDiasDisponiveisPublicosQueryDto;
  }) {
    if (dados.credencial) {
      await this.resolverCliente({
        salaoId,
        credencial: dados.credencial,
      });
    }

    return this.agendamentoService.listarDiasDisponiveis({
      salaoId,
      dados: {
        procedimento_id: dados.procedimento_id,
        mes: dados.mes,
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
    const sessaoPublica = await this.resolverSessao({
      salaoId,
      credencial: dados.credencial,
    });
    const clienteId = sessaoPublica.cliente?.id ?? (sessaoPublica as any).id;
    const sessaoId = sessaoPublica.sessao?.id;
    const pagamentoNoSalao =
      dados.opcao_pagamento === 'no_salao' || dados.pagamento_no_salao === true;

    const criado = await this.agendamentoService.criar({
      exigirSemSinal: true,
      salaoId,
      bloquearProcedimentoDuplicadoNoDia: true,
      notificarCliente: false,
      publico: true,
      sessaoClienteId: sessaoId,
      pagamentoNoSalao,
      dados: {
        cliente_id: clienteId,
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

  async reservar({
    salaoId,
    dados,
  }: {
    salaoId: string;
    dados: CriarAgendamentoPublicoDto;
  }) {
    const sessaoPublica = await this.resolverSessao({
      salaoId,
      credencial: dados.credencial,
    });
    const clienteId = sessaoPublica.cliente?.id ?? (sessaoPublica as any).id;
    const sessaoId = sessaoPublica.sessao?.id;

    return this.agendamentoService.criar({
      salaoId,
      bloquearProcedimentoDuplicadoNoDia: true,
      notificarCliente: false,
      reservar: true,
      publico: true,
      sessaoClienteId: sessaoId,
      dados: {
        cliente_id: clienteId,
        procedimento_id: dados.procedimento_id,
        data: dados.data,
        hora_inicio: dados.hora_inicio,
        confirmar_excecoes: dados.confirmar_excecoes,
      },
    });
  }

  private async resolverSessao({
    salaoId,
    credencial,
  }: {
    salaoId: string;
    credencial: string;
  }) {
    const sessao = await this.clienteService.resolverSessaoPublica({
      salaoId,
      credencial,
    });

    if (!sessao) {
      throw new NotFoundException('Sessão da cliente não encontrada.');
    }

    return sessao;
  }

  private async resolverCliente({
    salaoId,
    credencial,
  }: {
    salaoId: string;
    credencial: string;
  }) {
    const sessao = await this.resolverSessao({ salaoId, credencial });
    return sessao.cliente;
  }
}
