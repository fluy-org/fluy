import { reconhecerAvisoPublicoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ReconhecerAvisoPublicoRequestDto extends createZodDto(
  reconhecerAvisoPublicoSchema,
) {}
