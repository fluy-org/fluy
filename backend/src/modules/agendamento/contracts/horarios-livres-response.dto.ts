import { horariosLivresResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class HorariosLivresResponseDto extends createZodDto(
  horariosLivresResponseSchema,
) {}
