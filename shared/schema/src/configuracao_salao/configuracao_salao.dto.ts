import type { z } from 'zod';
import type {
  atualizarConfiguracaoSalaoSchema,
  configuracaoSalaoResponseSchema,
} from './configuracao_salao.schema.js';

export type AtualizarConfiguracaoSalaoDto = z.infer<
  typeof atualizarConfiguracaoSalaoSchema
>;
export type ConfiguracaoSalaoResponseDto = z.infer<
  typeof configuracaoSalaoResponseSchema
>;
