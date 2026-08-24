import { subdominioIndisponivelSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class SubdominioIndisponivelResponseDto extends createZodDto(
  subdominioIndisponivelSchema,
) {}
