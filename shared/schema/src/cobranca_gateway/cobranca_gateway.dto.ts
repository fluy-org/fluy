import type { z } from 'zod';
import type {
  pagadorPixSchema,
  instituicoesPixResponseSchema,
  recebimentoPixPublicoResponseSchema,
  webhookPagamentoResponseSchema,
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

export type PagadorPixDto = z.infer<typeof pagadorPixSchema>;
export type InstituicoesPixResponseDto = z.infer<typeof instituicoesPixResponseSchema>;
export type RecebimentoPixPublicoResponseDto = z.infer<typeof recebimentoPixPublicoResponseSchema>;
export type InstrucaoPagamentoPixDto = PagamentoPixResponseDto['instrucao_cliente'];
export type WebhookPagamentoResponseDto = z.infer<typeof webhookPagamentoResponseSchema>;
