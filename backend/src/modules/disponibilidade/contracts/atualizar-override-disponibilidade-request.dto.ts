import { atualizarOverrideDisponibilidadeSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AtualizarOverrideDisponibilidadeRequestDto extends createZodDto(
  atualizarOverrideDisponibilidadeSchema,
) {}
