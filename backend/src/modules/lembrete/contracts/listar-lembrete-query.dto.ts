import { listarLembreteQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarLembreteQueryDto extends createZodDto(
  listarLembreteQuerySchema,
) {}
