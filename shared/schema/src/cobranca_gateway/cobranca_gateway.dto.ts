import type { z } from 'zod';
import type {
  consultarPagamentoPixQuerySchema,
  iniciarPagamentoPixSchema,
  pagamentoPixResponseSchema,
  simularPagamentoPixSchema,
  simularPagamentoPixResponseSchema,
  reservaPixResponseSchema,
} from './cobranca_gateway.schema.js';

export type IniciarPagamentoPixDto = z.infer<typeof iniciarPagamentoPixSchema>;
export type ConsultarPagamentoPixQueryDto = z.infer<typeof consultarPagamentoPixQuerySchema>;
export type PagamentoPixResponseDto = z.infer<typeof pagamentoPixResponseSchema>;
export type SimularPagamentoPixDto = z.infer<typeof simularPagamentoPixSchema>;
export type SimularPagamentoPixResponseDto = z.infer<typeof simularPagamentoPixResponseSchema>;
export type ReservaPixResponseDto = z.infer<typeof reservaPixResponseSchema>;
