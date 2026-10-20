import { pagamentoPixResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class PagamentoPixResponseDto extends createZodDto(
  pagamentoPixResponseSchema,
) {}
