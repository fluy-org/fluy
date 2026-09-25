import { listaClientesResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaClientesResponseDto extends createZodDto(
  listaClientesResponseSchema,
) {}
