import { procedimentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ProcedimentoResponseDto extends createZodDto(
  procedimentoResponseSchema,
) {}
