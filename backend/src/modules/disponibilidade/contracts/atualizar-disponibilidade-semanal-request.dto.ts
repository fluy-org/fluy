import { atualizarDisponibilidadeSemanalSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarDisponibilidadeSemanalRequestDto extends createZodDto(
  atualizarDisponibilidadeSemanalSchema,
) {}
