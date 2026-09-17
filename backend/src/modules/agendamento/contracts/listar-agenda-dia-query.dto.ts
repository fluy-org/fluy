import { listarAgendaDiaQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarAgendaDiaQueryDto extends createZodDto(
  listarAgendaDiaQuerySchema,
) {}
