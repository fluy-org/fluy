import { consultarPagamentoPixQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ConsultarPagamentoPixQueryDto extends createZodDto(
  consultarPagamentoPixQuerySchema,
) {}
