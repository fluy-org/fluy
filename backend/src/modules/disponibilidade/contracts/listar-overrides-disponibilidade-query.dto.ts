import { listarOverridesDisponibilidadeQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarOverridesDisponibilidadeQueryDto extends createZodDto(
  listarOverridesDisponibilidadeQuerySchema,
) {}
