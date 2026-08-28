import { atualizarProcedimentoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarProcedimentoRequestDto extends createZodDto(
  atualizarProcedimentoSchema,
) {}
