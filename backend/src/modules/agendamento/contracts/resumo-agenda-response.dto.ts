import { resumoAgendaResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ResumoAgendaResponseDto extends createZodDto(
  resumoAgendaResponseSchema,
) {}
