import type { z } from 'zod';
import type {
  usuarioAtualResponseSchema,
  usuarioResponseSchema,
} from './usuario.schema.js';

export type UsuarioResponseDto = z.infer<typeof usuarioResponseSchema>;
export type UsuarioAtualResponseDto = z.infer<
  typeof usuarioAtualResponseSchema
>;
