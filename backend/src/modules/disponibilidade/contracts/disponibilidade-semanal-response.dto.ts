import { disponibilidadeSemanalResponseSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class DisponibilidadeSemanalResponseDto extends createZodDto(
  disponibilidadeSemanalResponseSchema,
) {}
