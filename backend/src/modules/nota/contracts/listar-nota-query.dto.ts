import { listarNotaQuerySchema } from '@fluy/schema';
import { createZodDto } from 'nestjs-zod';

export class ListarNotaQueryDto extends createZodDto(listarNotaQuerySchema) {}
