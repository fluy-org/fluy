import { diasDisponiveisResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class DiasDisponiveisResponseDto extends createZodDto(
  diasDisponiveisResponseSchema,
) {}
