import { listaNotasResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaNotasResponseDto extends createZodDto(
  listaNotasResponseSchema,
) {}
