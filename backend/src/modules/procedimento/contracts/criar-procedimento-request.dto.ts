import { criarProcedimentoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarProcedimentoRequestDto extends createZodDto(
  criarProcedimentoSchema,
) {}
