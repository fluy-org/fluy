import { consultarRetornoPagamentoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ConsultarRetornoPagamentoQueryDto extends createZodDto(
  consultarRetornoPagamentoQuerySchema,
) {}
