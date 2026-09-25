import { sessaoClientePublicaResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SessaoClientePublicaResponseDto extends createZodDto(
  sessaoClientePublicaResponseSchema,
) {}
