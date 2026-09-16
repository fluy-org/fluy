import { clienteResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ClienteResponseDto extends createZodDto(
  clienteResponseSchema,
) {}