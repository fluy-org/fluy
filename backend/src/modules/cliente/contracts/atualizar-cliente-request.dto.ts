import { atualizarClienteSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarClienteRequestDto extends createZodDto(
  atualizarClienteSchema,
) {}