import { listaSinaisRetidosFaturamentoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';
export class ListaSinaisRetidosFaturamentoResponseDto extends createZodDto(
  listaSinaisRetidosFaturamentoResponseSchema,
) {}
