import { avisoResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AvisoResponseDto extends createZodDto(avisoResponseSchema) {}
