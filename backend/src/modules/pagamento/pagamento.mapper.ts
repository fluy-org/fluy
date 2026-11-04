import type {
  PagamentoPixResponseDto,
  ReservaPixResponseDto,
} from '@fluy/schema';
import type { AgendamentoPersistido } from '@/modules/agendamento/contracts';
import { toAgendamentoResponse } from '@/modules/agendamento/agendamento.mapper';
import type { PagamentoConsultado } from '@/modules/pagamento/contracts';

export function toReservaPixResponse(
  reserva: AgendamentoPersistido,
): ReservaPixResponseDto {
  return {
    ...toAgendamentoResponse(reserva),
    expira_em: reserva.expira_em!.toISOString(),
  };
}

export function toPagamentoPixResponse(
  pagamento: PagamentoConsultado,
): PagamentoPixResponseDto {
  return {
    id: pagamento.id,
    status: pagamento.status,
    modalidade: pagamento.modalidade,
    nome_recebedor: pagamento.pix_nome_recebedor,
    valor_salao: Number(pagamento.valor),
    taxa_cliente: Number(pagamento.taxa_cliente),
    total_cliente: Number(pagamento.total_cliente),
    expira_em: pagamento.expira_em!.toISOString(),
    situacao: pagamento.divergencia ? 'confirmado_apos_expiracao' : 'normal',
    instrucao_cliente: pagamento.instrucao_cliente,
  };
}
