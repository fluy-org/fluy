import type { z } from 'zod';
import type {
  atualizarConfiguracaoSalaoSchema,
  configuracaoSalaoResponseSchema,
  atualizarRecebimentoPixSchema,
  recebimentoPixResponseSchema,
} from './configuracao_salao.schema.js';

export type AtualizarConfiguracaoSalaoDto = z.infer<
  typeof atualizarConfiguracaoSalaoSchema
>;
export type ConfiguracaoSalaoResponseDto = z.infer<
  typeof configuracaoSalaoResponseSchema
>;
export type AtualizarRecebimentoPixDto = z.infer<
  typeof atualizarRecebimentoPixSchema
>;
export type RecebimentoPixResponseDto = z.infer<
  typeof recebimentoPixResponseSchema
>;
