import { listarDiasDisponiveisPublicosQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarDiasDisponiveisPublicosQueryDto extends createZodDto(
  listarDiasDisponiveisPublicosQuerySchema,
) {}
