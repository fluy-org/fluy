import { listarAtendimentosFaturamentoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAtendimentosFaturamentoQueryDto extends createZodDto(
  listarAtendimentosFaturamentoQuerySchema,
) {}
