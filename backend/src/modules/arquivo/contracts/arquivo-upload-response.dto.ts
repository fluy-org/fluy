import { uploadArquivoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ArquivoUploadResponseDto extends createZodDto(
  uploadArquivoResponseSchema,
) {}
