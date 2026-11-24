import { Injectable } from '@nestjs/common';
import type {
  AgendamentoDetalhePersistido,
  AgendamentoDetalheResultado,
} from '@/modules/agendamento/contracts';
import { AvisoService } from '@/modules/aviso/aviso.service';

@Injectable()
export class AgendamentoAvisoService {
  constructor(private readonly avisoService: AvisoService) {}

  notificarCriacaoManual(agendamento: AgendamentoDetalheResultado) {
    return this.avisoService.criarParaCliente({
      salaoId: agendamento.salao_id,
      clienteId: agendamento.cliente.id,
      agendamentoId: agendamento.id,
      tipo: 'agendamento_criado',
      titulo: 'Novo agendamento',
      mensagem: `Seu agendamento de ${agendamento.procedimento.nome} foi marcado para ${this.formatarDataHora(agendamento.inicio_em, agendamento.fusoHorario)}.`,
    });
  }

  notificarCriacaoPublica(agendamento: AgendamentoDetalheResultado) {
    return this.avisoService.criarParaSalao({
      salaoId: agendamento.salao_id,
      agendamentoId: agendamento.id,
      tipo: 'novo_agendamento_salao',
      titulo: 'Novo agendamento',
      mensagem: `${agendamento.cliente.nome} agendou ${agendamento.procedimento.nome} para ${this.formatarDataHora(agendamento.inicio_em, agendamento.fusoHorario)}.`,
    });
  }

  notificarRemarcacao({
    anterior,
    atual,
  }: {
    anterior: AgendamentoDetalhePersistido;
    atual: AgendamentoDetalheResultado;
  }) {
    return this.avisoService.criarParaCliente({
      salaoId: atual.salao_id,
      clienteId: atual.cliente.id,
      agendamentoId: atual.id,
      tipo: 'agendamento_remarcado',
      titulo: 'Agendamento remarcado',
      mensagem: `Seu agendamento de ${atual.procedimento.nome} mudou de ${this.formatarDataHora(anterior.inicio_em, atual.fusoHorario)} para ${this.formatarDataHora(atual.inicio_em, atual.fusoHorario)}.`,
    });
  }

  notificarCancelamento(agendamento: AgendamentoDetalheResultado) {
    return this.avisoService.criarParaCliente({
      salaoId: agendamento.salao_id,
      clienteId: agendamento.cliente.id,
      agendamentoId: agendamento.id,
      tipo: 'agendamento_cancelado',
      titulo: 'Agendamento cancelado',
      mensagem: `Seu agendamento de ${agendamento.procedimento.nome}, marcado para ${this.formatarDataHora(agendamento.inicio_em, agendamento.fusoHorario)}, foi cancelado pelo salão.`,
    });
  }

  notificarCancelamentoPelaCliente(agendamento: AgendamentoDetalheResultado) {
    return this.avisoService.criarParaSalao({
      salaoId: agendamento.salao_id,
      agendamentoId: agendamento.id,
      tipo: 'cancelamento_cliente_salao',
      titulo: 'Agendamento cancelado pela cliente',
      mensagem: `${agendamento.cliente.nome} cancelou o agendamento de ${agendamento.procedimento.nome} de ${this.formatarDataHora(agendamento.inicio_em, agendamento.fusoHorario)}.`,
    });
  }

  notificarAgendamentoPagoConfirmado(agendamento: AgendamentoDetalheResultado) {
    return this.avisoService.criarParaSalao({
      salaoId: agendamento.salao_id,
      agendamentoId: agendamento.id,
      tipo: 'agendamento_pago_confirmado',
      titulo: 'Agendamento pago confirmado',
      mensagem: `${agendamento.cliente.nome} confirmou o pagamento de ${agendamento.procedimento.nome} para ${this.formatarDataHora(agendamento.inicio_em, agendamento.fusoHorario)}.`,
    });
  }

  notificarPagamentoAposPrazo(agendamento: AgendamentoDetalheResultado) {
    return this.avisoService.criarParaSalao({
      salaoId: agendamento.salao_id,
      agendamentoId: agendamento.id,
      tipo: 'pagamento_apos_prazo',
      titulo: 'Pagamento recebido após o prazo',
      mensagem: `Pagamento recebido para a reserva expirada de ${agendamento.cliente.nome} (${agendamento.procedimento.nome}). Combine o encaixe ou realize o estorno.`,
    });
  }

  private formatarDataHora(data: Date, fusoHorario?: string): string {
    const fuso = fusoHorario?.trim() || 'America/Sao_Paulo';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: fuso,
      }).format(data);
    } catch {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(data);
    }
  }
}
