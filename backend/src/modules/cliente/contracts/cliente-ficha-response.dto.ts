import { clienteFichaResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ClienteFichaResponseDto extends createZodDto(
  clienteFichaResponseSchema,
) {}
