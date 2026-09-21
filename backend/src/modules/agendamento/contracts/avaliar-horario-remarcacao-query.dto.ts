import { avaliarHorarioRemarcacaoQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class AvaliarHorarioRemarcacaoQueryDto extends createZodDto(
  avaliarHorarioRemarcacaoQuerySchema,
) {}
