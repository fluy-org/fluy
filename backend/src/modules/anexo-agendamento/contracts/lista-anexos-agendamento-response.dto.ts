import { listaAnexosAgendamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaAnexosAgendamentoResponseDto extends createZodDto(
  listaAnexosAgendamentoResponseSchema,
) {}
