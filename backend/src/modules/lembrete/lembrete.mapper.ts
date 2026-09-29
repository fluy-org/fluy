import type {
  LembreteResponseDto,
  ListaLembretesResponseDto,
} from '@fluy/schema';
import type {
  LembreteComClientePersistido,
  ListaLembretesResultado,
} from '@/modules/lembrete/contracts';

export function toLembreteResponse(
  lembrete: LembreteComClientePersistido,
): LembreteResponseDto {
  return {
    id: lembrete.id,
    texto: lembrete.texto,
    data_alvo: lembrete.data_alvo,
    origem: lembrete.origem,
    status: lembrete.status,
    cliente: {
      id: lembrete.cliente.id,
      nome: lembrete.cliente.nome,
    },
    agendamento_id: lembrete.agendamento_id,
    criado_em: lembrete.criado_em.toISOString(),
    concluido_em: lembrete.concluido_em?.toISOString() ?? null,
  };
}

export function toListaLembretesResponse({
  fusoHorario,
  itens,
  proximoCursor,
}: ListaLembretesResultado): ListaLembretesResponseDto {
  return {
    fuso_horario: fusoHorario,
    itens: itens.map(toLembreteResponse),
    proximo_cursor: proximoCursor,
  };
}
