import { listaAgendamentosClienteResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaAgendamentosPublicosResponseDto extends createZodDto(
  listaAgendamentosClienteResponseSchema,
) {}
