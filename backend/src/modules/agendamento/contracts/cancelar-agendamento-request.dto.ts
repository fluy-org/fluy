import { cancelarAgendamentoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CancelarAgendamentoRequestDto extends createZodDto(
  cancelarAgendamentoSchema,
) {}
