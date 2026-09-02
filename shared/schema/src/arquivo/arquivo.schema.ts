import { z } from "zod";

export const uploadArquivoResponseSchema = z
  .object({
    arquivo_id: z.uuid(),
  })
  .meta({ id: "UploadArquivoResponse" });
