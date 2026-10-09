import { anexoAgendamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AnexoAgendamentoResponseDto extends createZodDto(
  anexoAgendamentoResponseSchema,
) {}
