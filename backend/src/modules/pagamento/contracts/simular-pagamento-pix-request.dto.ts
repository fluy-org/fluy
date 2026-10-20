import { simularPagamentoPixSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SimularPagamentoPixRequestDto extends createZodDto(
  simularPagamentoPixSchema,
) {}
