import type { z } from "zod";
import type {
  agendamentoClienteResponseSchema,
  atualizarClienteSchema,
  clienteFichaResponseSchema,
  clienteListaItemResponseSchema,
  clienteResponseSchema,
  criarClienteSchema,
  listaAgendamentosClienteResponseSchema,
  listaClientesResponseSchema,
  listarAgendamentosClienteQuerySchema,
  listarClienteQuerySchema,
  metricasClienteSchema,
} from "./cliente.schema.js";

export type CriarClienteDto = z.infer<typeof criarClienteSchema>;
export type AtualizarClienteDto = z.infer<typeof atualizarClienteSchema>;
export type ClienteResponseDto = z.infer<typeof clienteResponseSchema>;
export type ListarClienteQueryDto = z.infer<typeof listarClienteQuerySchema>;
export type ClienteListaItemResponseDto = z.infer<
  typeof clienteListaItemResponseSchema
>;
export type ListaClientesResponseDto = z.infer<
  typeof listaClientesResponseSchema
>;
export type MetricasClienteDto = z.infer<typeof metricasClienteSchema>;
export type ClienteFichaResponseDto = z.infer<
  typeof clienteFichaResponseSchema
>;
export type ListarAgendamentosClienteQueryDto = z.infer<
  typeof listarAgendamentosClienteQuerySchema
>;
export type AgendamentoClienteResponseDto = z.infer<
  typeof agendamentoClienteResponseSchema
>;
export type ListaAgendamentosClienteResponseDto = z.infer<
  typeof listaAgendamentosClienteResponseSchema
>;
