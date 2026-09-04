import { listaOverridesDisponibilidadeResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaOverridesDisponibilidadeResponseDto extends createZodDto(
  listaOverridesDisponibilidadeResponseSchema,
) {}
