import { overrideDisponibilidadeResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class OverrideDisponibilidadeResponseDto extends createZodDto(
  overrideDisponibilidadeResponseSchema,
) {}
