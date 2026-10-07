import type { z } from 'zod';
import type {
  atendimentoFaturamentoResponseSchema,
  faturamentoResponseSchema,
  listaAtendimentosFaturamentoResponseSchema,
  listarAtendimentosFaturamentoQuerySchema,
  listarFaturamentoQuerySchema,
  pagamentoFaturamentoSchema,
  periodoFaturamentoSchema,
  recebimentoPorMetodoSchema,
  resumoFaturamentoSchema,
  sinalRetidoResponseSchema,
} from './faturamento.schema.js';

export type ListarFaturamentoQueryDto = z.infer<
  typeof listarFaturamentoQuerySchema
>;
export type ListarAtendimentosFaturamentoQueryDto = z.infer<
  typeof listarAtendimentosFaturamentoQuerySchema
>;
export type PagamentoFaturamentoDto = z.infer<typeof pagamentoFaturamentoSchema>;
export type PeriodoFaturamentoDto = z.infer<typeof periodoFaturamentoSchema>;
export type ResumoFaturamentoDto = z.infer<typeof resumoFaturamentoSchema>;
export type RecebimentoPorMetodoDto = z.infer<typeof recebimentoPorMetodoSchema>;
export type SinalRetidoResponseDto = z.infer<typeof sinalRetidoResponseSchema>;
export type FaturamentoResponseDto = z.infer<typeof faturamentoResponseSchema>;
export type AtendimentoFaturamentoResponseDto = z.infer<
  typeof atendimentoFaturamentoResponseSchema
>;
export type ListaAtendimentosFaturamentoResponseDto = z.infer<
  typeof listaAtendimentosFaturamentoResponseSchema
>;
