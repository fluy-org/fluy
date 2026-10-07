import { listaAvisosResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaAvisosResponseDto extends createZodDto(
  listaAvisosResponseSchema,
) {}
