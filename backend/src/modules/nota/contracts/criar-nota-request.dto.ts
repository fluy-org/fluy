import { criarNotaSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarNotaRequestDto extends createZodDto(criarNotaSchema) {}
