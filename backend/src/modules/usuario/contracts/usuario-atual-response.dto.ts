import { usuarioAtualResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class UsuarioAtualResponseDto extends createZodDto(
  usuarioAtualResponseSchema,
) {}
