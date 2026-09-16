import { listarHorariosLivresQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarHorariosLivresQueryDto extends createZodDto(
  listarHorariosLivresQuerySchema,
) {}
