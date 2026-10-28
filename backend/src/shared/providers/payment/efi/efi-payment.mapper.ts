import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { NotificacaoPagamento } from '@/modules/pagamento/contracts';
const money = z.string().regex(/^\d{1,8}\.\d{2}$/);
export const efiPaymentSchema = z.object({
  identificadorPagamento: z.string().min(1).max(200),
  idProprio: z.string().max(200).optional(),
  valor: money,
  status: z.enum(['pendente', 'aceito', 'rejeitado', 'cancelado', 'expirado']),
  dataCriacao: z.iso.datetime(),
  tipo: z.literal('pagamento').optional(),
});

export function normalizarPagamentoEfi(
  data: z.infer<typeof efiPaymentSchema>,
): NotificacaoPagamento | null {
  if (data.status === 'pendente') return null;
  const value = Number(data.valor.replace('.', ''));
  return {
    provider: 'efi',
    tipoBruto: data.status,
    eventId: createHash('sha256')
      .update(
        JSON.stringify([data.identificadorPagamento, data.status, data.valor]),
      )
      .digest('hex'),
    externalPaymentId: data.identificadorPagamento,
    reference: data.idProprio,
    tipo:
      data.status === 'aceito'
        ? 'confirmado'
        : data.status === 'expirado'
          ? 'expirado'
          : 'falhou',
    ocorridoEm: new Date(data.dataCriacao),
    ...(data.status === 'aceito' ? { valorPagoCentavos: value } : {}),
  };
}
