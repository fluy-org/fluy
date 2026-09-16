import { criarClienteSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarClienteRequestDto extends createZodDto(
  criarClienteSchema,
) {}