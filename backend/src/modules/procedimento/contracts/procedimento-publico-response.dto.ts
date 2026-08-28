import { procedimentoPublicoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ProcedimentoPublicoResponseDto extends createZodDto(
  procedimentoPublicoResponseSchema,
) {}
