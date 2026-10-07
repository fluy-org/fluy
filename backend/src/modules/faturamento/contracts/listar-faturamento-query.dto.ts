import { listarFaturamentoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarFaturamentoQueryDto extends createZodDto(
  listarFaturamentoQuerySchema,
) {}
