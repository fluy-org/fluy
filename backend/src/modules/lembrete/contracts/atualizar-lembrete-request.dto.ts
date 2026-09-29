import { atualizarLembreteSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarLembreteRequestDto extends createZodDto(
  atualizarLembreteSchema,
) {}
