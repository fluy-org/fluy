import type {
  AgendaDiaResponseDto,
  AgendamentoAgendaResponseDto,
  AgendamentoDetalheResponseDto,
  AgendamentoResponseDto,
  AvaliacaoHorarioAgendamentoResponseDto,
  HorariosLivresResponseDto,
  ResumoAgendaResponseDto,
} from '@fluy/schema';
import type {
  AgendaDoDiaResultado,
  AgendamentoDaAgendaResultado,
  AgendamentoDetalheResultado,
  AgendamentoPersistido,
  AvaliacaoHorarioAgendamento,
  ResumoDaAgendaResultado,
} from '@/modules/agendamento/contracts';

export function toAgendamentoResponse(
  agendamento: AgendamentoPersistido,
): AgendamentoResponseDto {
  return {
    id: agendamento.id,
    profissional_id: agendamento.profissional_id,
    cliente_id: agendamento.cliente_id,
    procedimento_id: agendamento.procedimento_id,
    inicio_em: agendamento.inicio_em.toISOString(),
    duracao_min: agendamento.duracao_min,
    preco_total: Number(agendamento.preco_total),
    valor_sinal: Number(agendamento.valor_sinal),
    estado: agendamento.estado,
    criado_em: agendamento.criado_em.toISOString(),
  };
}

export function toAvaliacaoHorarioResponse(
  avaliacao: AvaliacaoHorarioAgendamento,
): AvaliacaoHorarioAgendamentoResponseDto {
  return {
    status: avaliacao.status,
    avisos: avaliacao.avisos,
    bloqueios: avaliacao.bloqueios,
  };
}

export function toHorariosLivresResponse({
  data,
  horarios,
}: HorariosLivresResponseDto): HorariosLivresResponseDto {
  return { data, horarios };
}

export function toAgendaDiaResponse({
  data,
  fusoHorario,
  agendamentos,
}: AgendaDoDiaResultado): AgendaDiaResponseDto {
  return {
    data,
    fuso_horario: fusoHorario,
    agendamentos: agendamentos.map(toAgendamentoAgendaResponse),
  };
}

export function toResumoAgendaResponse({
  dias,
}: ResumoDaAgendaResultado): ResumoAgendaResponseDto {
  return { dias };
}

export function toAgendamentoDetalheResponse(
  agendamento: AgendamentoDetalheResultado,
): AgendamentoDetalheResponseDto {
  return {
    ...toAgendamentoAgendaResponse(agendamento),
    fuso_horario: agendamento.fusoHorario,
    cliente: {
      id: agendamento.cliente.id,
      nome: agendamento.cliente.nome,
      whatsapp: agendamento.cliente.whatsapp,
    },
    criado_em: agendamento.criado_em.toISOString(),
    acoes_permitidas: agendamento.acoesPermitidas,
    avisos: agendamento.avisos,
    remarcado_vezes: agendamento.remarcado_vezes,
  };
}

function toAgendamentoAgendaResponse(
  agendamento: AgendamentoDaAgendaResultado,
): AgendamentoAgendaResponseDto {
  return {
    id: agendamento.id,
    inicio_em: agendamento.inicio_em.toISOString(),
    duracao_min: agendamento.duracao_min,
    estado: agendamento.estado,
    cliente: {
      id: agendamento.cliente.id,
      nome: agendamento.cliente.nome,
    },
    procedimento: {
      id: agendamento.procedimento.id,
      nome: agendamento.procedimento.nome,
    },
    preco_total: Number(agendamento.preco_total),
    valor_sinal: Number(agendamento.valor_sinal),
    valor_pago: Number(agendamento.valorPago),
    valor_pendente: Number(agendamento.valorPendente),
    tem_imagens_referencia: false,
    tem_observacoes: false,
  };
}
