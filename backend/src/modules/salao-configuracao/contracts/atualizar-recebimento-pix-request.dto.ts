import { atualizarRecebimentoPixSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarRecebimentoPixRequestDto extends createZodDto(
  atualizarRecebimentoPixSchema,
) {}
