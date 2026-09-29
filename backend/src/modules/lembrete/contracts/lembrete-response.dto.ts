import { lembreteResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class LembreteResponseDto extends createZodDto(lembreteResponseSchema) {}
