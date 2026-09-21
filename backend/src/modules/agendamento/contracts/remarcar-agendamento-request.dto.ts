import { remarcarAgendamentoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class RemarcarAgendamentoRequestDto extends createZodDto(
  remarcarAgendamentoSchema,
) {}
