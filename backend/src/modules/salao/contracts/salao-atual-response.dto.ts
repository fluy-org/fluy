import { salaoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SalaoAtualResponseDto extends createZodDto(salaoResponseSchema) {}
