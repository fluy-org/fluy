import { listarClienteQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarClienteQueryDto extends createZodDto(
  listarClienteQuerySchema,
) {}
