import { listaAgendamentosClienteResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListaAgendamentosClienteResponseDto extends createZodDto(
  listaAgendamentosClienteResponseSchema,
) {}
