import { simularPagamentoPixResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SimularPagamentoPixResponseDto extends createZodDto(
  simularPagamentoPixResponseSchema,
) {}
