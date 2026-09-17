import { agendaDiaResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AgendaDiaResponseDto extends createZodDto(
  agendaDiaResponseSchema,
) {}
