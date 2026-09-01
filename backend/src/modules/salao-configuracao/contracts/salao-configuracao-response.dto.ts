import { configuracaoSalaoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SalaoConfiguracaoResponseDto extends createZodDto(
  configuracaoSalaoResponseSchema,
) {}
