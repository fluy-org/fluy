import { agendamentoDetalheResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AgendamentoDetalheResponseDto extends createZodDto(
  agendamentoDetalheResponseSchema,
) {}
