import { criarSalaoSchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class CriarSalaoRequestDto extends createZodDto(criarSalaoSchema) {}
