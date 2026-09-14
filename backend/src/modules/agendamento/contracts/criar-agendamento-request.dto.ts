import { criarAgendamentoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarAgendamentoRequestDto extends createZodDto(
  criarAgendamentoSchema,
) {}
