import { recebimentoPixResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class RecebimentoPixResponseDto extends createZodDto(
  recebimentoPixResponseSchema,
) {}
