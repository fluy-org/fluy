import { createZodDto } from 'nestjs-zod';
import {
  instituicoesPixResponseSchema,
  recebimentoPixPublicoResponseSchema,
} from '@fluy/schema';
export class InstituicoesPixResponseDto extends createZodDto(
  instituicoesPixResponseSchema,
) {}
export class RecebimentoPixPublicoResponseDto extends createZodDto(
  recebimentoPixPublicoResponseSchema,
) {}
