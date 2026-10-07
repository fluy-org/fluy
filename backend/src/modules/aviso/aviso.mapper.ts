import type { AvisoResponseDto, ListaAvisosResponseDto } from '@fluy/schema';
import type {
  AvisoPersistido,
  ListaAvisosResultado,
} from '@/modules/aviso/contracts';

export function toAvisoResponse(aviso: AvisoPersistido): AvisoResponseDto {
  return {
    id: aviso.id,
    tipo: aviso.tipo,
    titulo: aviso.titulo,
    mensagem: aviso.mensagem,
    agendamento_id: aviso.agendamento_id,
    criado_em: aviso.criado_em.toISOString(),
    reconhecido_em: aviso.reconhecido_em?.toISOString() ?? null,
  };
}

export function toListaAvisosResponse({
  itens,
  proximoCursor,
}: ListaAvisosResultado): ListaAvisosResponseDto {
  return {
    itens: itens.map(toAvisoResponse),
    proximo_cursor: proximoCursor,
  };
}
