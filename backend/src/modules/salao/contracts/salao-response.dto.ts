import { salaoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SalaoResponseDto extends createZodDto(salaoResponseSchema) {}
