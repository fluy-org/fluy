import type { ListaNotasResponseDto, NotaResponseDto } from '@fluy/schema';
import type {
  ListaNotasResultado,
  NotaPersistida,
} from '@/modules/nota/contracts';

export function toNotaResponse(nota: NotaPersistida): NotaResponseDto {
  return {
    id: nota.id,
    cliente_id: nota.cliente_id,
    agendamento_id: nota.agendamento_id,
    texto: nota.texto,
    criada_em: nota.criada_em.toISOString(),
  };
}

export function toListaNotasResponse({
  fusoHorario,
  itens,
  proximoCursor,
}: ListaNotasResultado): ListaNotasResponseDto {
  return {
    fuso_horario: fusoHorario,
    itens: itens.map(toNotaResponse),
    proximo_cursor: proximoCursor,
  };
}
