import type { z } from "zod";
import type { uploadArquivoResponseSchema } from "./arquivo.schema.js";

export type UploadArquivoResponseDto = z.infer<
  typeof uploadArquivoResponseSchema
>;
