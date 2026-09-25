import { consultarSessaoClienteSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ConsultarSessaoClienteQueryDto extends createZodDto(
  consultarSessaoClienteSchema,
) {}
