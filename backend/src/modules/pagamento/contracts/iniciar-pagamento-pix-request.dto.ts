import { iniciarPagamentoPixSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class IniciarPagamentoPixRequestDto extends createZodDto(
  iniciarPagamentoPixSchema,
) {}
