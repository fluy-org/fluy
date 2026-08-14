import type { z } from 'zod';
import type { usuarioResponseSchema } from './usuario.schema.js';

export type UsuarioResponseDto = z.infer<typeof usuarioResponseSchema>;
