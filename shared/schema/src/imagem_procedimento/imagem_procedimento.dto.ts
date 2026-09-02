import type { z } from "zod";
import type { imagemProcedimentoInputSchema } from "./imagem_procedimento.schema.js";

export type ImagemProcedimentoDto = z.infer<
  typeof imagemProcedimentoInputSchema
>;
