import { salaoPublicoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SalaoPublicoResponseDto extends createZodDto(
  salaoPublicoResponseSchema,
) {}
