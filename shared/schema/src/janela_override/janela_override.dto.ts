import type { z } from 'zod';
import type {
  janelaOverrideInputSchema,
  janelaOverrideResponseSchema,
} from './janela_override.schema.js';

export type JanelaOverrideInputDto = z.infer<
  typeof janelaOverrideInputSchema
>;
export type JanelaOverrideResponseDto = z.infer<
  typeof janelaOverrideResponseSchema
>;
