import { listarHorariosLivresRemarcacaoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarHorariosLivresRemarcacaoQueryDto extends createZodDto(
  listarHorariosLivresRemarcacaoQuerySchema,
) {}
