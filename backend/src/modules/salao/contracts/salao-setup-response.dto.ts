import { salaoSetupResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SalaoSetupResponseDto extends createZodDto(
  salaoSetupResponseSchema,
) {}
