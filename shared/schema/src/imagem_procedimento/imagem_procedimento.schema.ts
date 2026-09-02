import { z } from "zod";

export const imagemProcedimentoInputSchema = z.object({
  arquivo_id: z.uuid(),
});
