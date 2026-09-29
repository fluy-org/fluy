import { listaLembretesResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaLembretesResponseDto extends createZodDto(
  listaLembretesResponseSchema,
) {}
