import { consultarAgendamentoPublicoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ConsultarAgendamentoPublicoQueryDto extends createZodDto(
  consultarAgendamentoPublicoQuerySchema,
) {}
