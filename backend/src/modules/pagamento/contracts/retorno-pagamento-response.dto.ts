import { retornoPagamentoPublicoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class RetornoPagamentoPublicoResponseDto extends createZodDto(
  retornoPagamentoPublicoResponseSchema,
) {}
