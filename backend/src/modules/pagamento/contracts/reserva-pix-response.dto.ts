import { reservaPixResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ReservaPixResponseDto extends createZodDto(
  reservaPixResponseSchema,
) {}
