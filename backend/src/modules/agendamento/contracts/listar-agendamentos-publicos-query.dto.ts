import { listarAgendamentosPublicosQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAgendamentosPublicosQueryDto extends createZodDto(
  listarAgendamentosPublicosQuerySchema,
) {}
