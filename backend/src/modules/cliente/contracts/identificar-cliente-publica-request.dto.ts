import { identificarClientePublicaSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class IdentificarClientePublicaRequestDto extends createZodDto(
  identificarClientePublicaSchema,
) {}
