import { cancelarAgendamentoPublicoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CancelarAgendamentoPublicoRequestDto extends createZodDto(
  cancelarAgendamentoPublicoSchema,
) {}
