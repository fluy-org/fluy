import { faturamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class FaturamentoResponseDto extends createZodDto(
  faturamentoResponseSchema,
) {}
