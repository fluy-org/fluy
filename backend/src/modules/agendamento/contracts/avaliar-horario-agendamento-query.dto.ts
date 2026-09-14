import { avaliarHorarioAgendamentoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AvaliarHorarioAgendamentoQueryDto extends createZodDto(
  avaliarHorarioAgendamentoQuerySchema,
) {}
