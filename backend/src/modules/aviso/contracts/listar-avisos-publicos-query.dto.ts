import { listarAvisosPublicosQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAvisosPublicosQueryDto extends createZodDto(
  listarAvisosPublicosQuerySchema,
) {}
