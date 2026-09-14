import { agendamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AgendamentoResponseDto extends createZodDto(
  agendamentoResponseSchema,
) {}
