import { criarAgendamentoPublicoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarAgendamentoPublicoRequestDto extends createZodDto(
  criarAgendamentoPublicoSchema,
) {}
