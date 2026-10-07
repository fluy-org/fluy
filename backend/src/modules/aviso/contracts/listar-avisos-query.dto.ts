import { listarAvisosQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAvisosQueryDto extends createZodDto(
  listarAvisosQuerySchema,
) {}
