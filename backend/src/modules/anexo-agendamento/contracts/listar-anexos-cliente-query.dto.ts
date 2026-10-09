import { listarAnexosClienteQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAnexosClienteQueryDto extends createZodDto(
  listarAnexosClienteQuerySchema,
) {}
