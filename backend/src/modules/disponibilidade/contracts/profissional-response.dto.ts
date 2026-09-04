import { profissionalResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ProfissionalResponseDto extends createZodDto(
  profissionalResponseSchema,
) {}
