import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { NotificacaoPagamento } from '@/modules/pagamento/contracts';
const money = z.string().regex(/^\d{1,8}\.\d{2}$/);

export const efiStatusValidos = [
  'pendente',
  'aceito',
  'rejeitado',
  'cancelado',
  'expirado',
  'em_processamento',
  'acsp',
  'acsc',
  'pdng',
  'rjct',
  'expr',
  'canc',
] as const;

export const efiPaymentSchema = z
  .object({
    identificadorPagamento: z.string().min(1).max(200),
    idProprio: z.string().max(200).nullable().optional(),
    valor: money.nullable().optional(),
    status: z.string().refine(
      (s) => efiStatusValidos.includes(s.toLowerCase() as (typeof efiStatusValidos)[number]),
      { message: 'Status Efí não suportado' },
    ),
    dataCriacao: z.string().nullable().optional(),
    tipo: z.string().nullable().optional(),
  })
  .passthrough();

export function normalizarPagamentoEfi(
  data: z.infer<typeof efiPaymentSchema>,
): NotificacaoPagamento | null {
  const statusLower = data.status.toLowerCase();

  if (
    statusLower === 'pendente' ||
    statusLower === 'pdng' ||
    statusLower === 'em_processamento' ||
    statusLower === 'acsc'
  ) {
    return null;
  }

  const isConfirmed = statusLower === 'aceito' || statusLower === 'acsp';
  const isExpired = statusLower === 'expirado' || statusLower === 'expr';

  let valorPagoCentavos: number | undefined;
  if (data.valor) {
    valorPagoCentavos = Math.round(Number(data.valor) * 100);
  }

  const dataHora = data.dataCriacao ? new Date(data.dataCriacao) : new Date();
  const ocorridoEm = Number.isNaN(dataHora.getTime()) ? new Date() : dataHora;

  return {
    provider: 'efi',
    tipoBruto: data.status,
    eventId: createHash('sha256')
      .update(
        JSON.stringify([
          data.identificadorPagamento,
          data.status,
          data.valor ?? null,
        ]),
      )
      .digest('hex'),
    externalPaymentId: data.identificadorPagamento,
    reference: data.idProprio ?? undefined,
    tipo: isConfirmed ? 'confirmado' : isExpired ? 'expirado' : 'falhou',
    ocorridoEm,
    ...(isConfirmed && valorPagoCentavos !== undefined
      ? { valorPagoCentavos }
      : {}),
  };
}
