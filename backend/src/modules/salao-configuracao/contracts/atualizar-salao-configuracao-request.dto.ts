import { atualizarConfiguracaoSalaoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarSalaoConfiguracaoRequestDto extends createZodDto(
  atualizarConfiguracaoSalaoSchema,
) {}
