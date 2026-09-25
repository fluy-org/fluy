import type { z } from 'zod';
import type {
  criarSalaoSchema,
  salaoPublicoResponseSchema,
  salaoResponseSchema,
  subdominioIndisponivelSchema,
} from './salao.schema.js';

export type CriarSalaoDto = z.infer<typeof criarSalaoSchema>;
export type SalaoResponseDto = z.infer<typeof salaoResponseSchema>;
export type SalaoPublicoResponseDto = z.infer<
  typeof salaoPublicoResponseSchema
>;
export type SubdominioIndisponivelDto = z.infer<
  typeof subdominioIndisponivelSchema
>;
