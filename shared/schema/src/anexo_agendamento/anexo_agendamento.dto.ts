import type { z } from 'zod';
import type {
  anexoAgendamentoResponseSchema,
  listaAnexosAgendamentoResponseSchema,
  listaAnexosClienteResponseSchema,
  listarAnexosClienteQuerySchema,
} from './anexo_agendamento.schema.js';

export type AnexoAgendamentoResponseDto = z.infer<
  typeof anexoAgendamentoResponseSchema
>;

export type ListaAnexosAgendamentoResponseDto = z.infer<
  typeof listaAnexosAgendamentoResponseSchema
>;

export type ListarAnexosClienteQueryDto = z.infer<
  typeof listarAnexosClienteQuerySchema
>;

export type ListaAnexosClienteResponseDto = z.infer<
  typeof listaAnexosClienteResponseSchema
>;
