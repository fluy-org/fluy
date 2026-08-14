import { usuarioResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class UsuarioResponseDto extends createZodDto(usuarioResponseSchema) {}
