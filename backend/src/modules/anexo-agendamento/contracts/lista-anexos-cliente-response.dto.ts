import { listaAnexosClienteResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaAnexosClienteResponseDto extends createZodDto(
  listaAnexosClienteResponseSchema,
) {}
