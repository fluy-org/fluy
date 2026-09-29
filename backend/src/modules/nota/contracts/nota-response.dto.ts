import { notaResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class NotaResponseDto extends createZodDto(notaResponseSchema) {}
