import { listaAtendimentosFaturamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaAtendimentosFaturamentoResponseDto extends createZodDto(
  listaAtendimentosFaturamentoResponseSchema,
) {}
