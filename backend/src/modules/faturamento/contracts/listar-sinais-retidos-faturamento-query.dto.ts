import { listarSinaisRetidosFaturamentoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';
export class ListarSinaisRetidosFaturamentoQueryDto extends createZodDto(
  listarSinaisRetidosFaturamentoQuerySchema,
) {}
