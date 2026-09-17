import { concluirAgendamentoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ConcluirAgendamentoRequestDto extends createZodDto(
  concluirAgendamentoSchema,
) {}
