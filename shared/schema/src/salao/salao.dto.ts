import type { z } from 'zod';
import type {
  criarSalaoSchema,
  salaoResponseSchema,
  subdominioIndisponivelSchema,
} from './salao.schema.js';

export type CriarSalaoDto = z.infer<typeof criarSalaoSchema>;
export type SalaoResponseDto = z.infer<typeof salaoResponseSchema>;
export type SubdominioIndisponivelDto = z.infer<
  typeof subdominioIndisponivelSchema
>;
