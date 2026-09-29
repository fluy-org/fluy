import { criarLembreteSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarLembreteRequestDto extends createZodDto(
  criarLembreteSchema,
) {}
