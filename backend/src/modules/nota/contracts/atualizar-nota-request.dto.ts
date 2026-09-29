import { atualizarNotaSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarNotaRequestDto extends createZodDto(
  atualizarNotaSchema,
) {}
