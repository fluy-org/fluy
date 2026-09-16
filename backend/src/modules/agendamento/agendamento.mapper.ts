import type {
  AgendamentoResponseDto,
  AvaliacaoHorarioAgendamentoResponseDto,
  HorariosLivresResponseDto,
} from '@fluy/schema';
import type {
  AgendamentoPersistido,
  AvaliacaoHorarioAgendamento,
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
