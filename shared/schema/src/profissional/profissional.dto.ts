import type { z } from 'zod';
import type { profissionalResponseSchema } from './profissional.schema.js';

export type ProfissionalResponseDto = z.infer<
  typeof profissionalResponseSchema
>;
