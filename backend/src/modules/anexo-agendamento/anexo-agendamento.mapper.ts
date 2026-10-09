import type {
  AnexoAgendamentoResponseDto,
  ListaAnexosAgendamentoResponseDto,
} from '@fluy/schema';
import type { AnexoAgendamentoComArquivoPersistido } from '@/modules/anexo-agendamento/contracts';

export function toAnexoAgendamentoResponse(
  anexo: AnexoAgendamentoComArquivoPersistido,
): AnexoAgendamentoResponseDto {
  return {
    id: anexo.id,
    agendamento_id: anexo.agendamento_id,
    visibilidade: anexo.visibilidade,
    mime_type: anexo.arquivo.mime_type,
    tamanho_bytes: anexo.arquivo.tamanho_bytes,
    criado_em: anexo.criado_em.toISOString(),
  };
}

export function toListaAnexosAgendamentoResponse(
  anexos: AnexoAgendamentoComArquivoPersistido[],
): ListaAnexosAgendamentoResponseDto {
  return { anexos: anexos.map(toAnexoAgendamentoResponse) };
}

export function toListaAnexosClienteResponse({
  itens,
  proximoCursor,
}: {
  itens: AnexoAgendamentoComArquivoPersistido[];
  proximoCursor: string | null;
}) {
  return {
    itens: itens.map(toAnexoAgendamentoResponse),
    proximo_cursor: proximoCursor,
  };
}
