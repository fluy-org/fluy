import { listarHorariosLivresPublicosQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarHorariosLivresPublicosQueryDto extends createZodDto(
  listarHorariosLivresPublicosQuerySchema,
) {}
