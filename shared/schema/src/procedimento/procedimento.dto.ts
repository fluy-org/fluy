import type { z } from "zod";
import type {
  atualizarProcedimentoSchema,
  criarProcedimentoSchema,
  procedimentoPublicoResponseSchema,
  procedimentoResponseSchema,
} from "./procedimento.schema.js";

export type CriarProcedimentoDto = z.infer<typeof criarProcedimentoSchema>;
export type AtualizarProcedimentoDto = z.infer<
  typeof atualizarProcedimentoSchema
>;
export type ProcedimentoResponseDto = z.infer<
  typeof procedimentoResponseSchema
>;
export type ProcedimentoPublicoResponseDto = z.infer<
  typeof procedimentoPublicoResponseSchema
>;
