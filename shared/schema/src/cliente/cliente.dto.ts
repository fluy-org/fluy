import type { z } from "zod";
import type {
  atualizarClienteSchema,
  clienteResponseSchema,
  criarClienteSchema,
  listarClienteQuerySchema,
} from "./cliente.schema.js";

export type CriarClienteDto = z.infer<typeof criarClienteSchema>;
export type AtualizarClienteDto = z.infer<typeof atualizarClienteSchema>;
export type ClienteResponseDto = z.infer<typeof clienteResponseSchema>;
export type ListarClienteQueryDto = z.infer<typeof listarClienteQuerySchema>;
