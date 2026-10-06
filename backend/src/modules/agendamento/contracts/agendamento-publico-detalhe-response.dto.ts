import { agendamentoPublicoDetalheResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AgendamentoPublicoDetalheResponseDto extends createZodDto(
  agendamentoPublicoDetalheResponseSchema,
) {}
