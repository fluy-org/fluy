import { avaliacaoHorarioAgendamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AvaliacaoHorarioAgendamentoResponseDto extends createZodDto(
  avaliacaoHorarioAgendamentoResponseSchema,
) {}
