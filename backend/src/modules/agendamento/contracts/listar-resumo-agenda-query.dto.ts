import { listarResumoAgendaQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarResumoAgendaQueryDto extends createZodDto(
  listarResumoAgendaQuerySchema,
) {}
