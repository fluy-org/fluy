import { listarAgendamentosClienteQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAgendamentosClienteQueryDto extends createZodDto(
  listarAgendamentosClienteQuerySchema,
) {}
