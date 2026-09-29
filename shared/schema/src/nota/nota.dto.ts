import type { z } from 'zod';
import type {
  atualizarNotaSchema,
  criarNotaSchema,
  listaNotasResponseSchema,
  listarNotaQuerySchema,
  notaResponseSchema,
} from './nota.schema.js';

export type CriarNotaDto = z.infer<typeof criarNotaSchema>;
export type AtualizarNotaDto = z.infer<typeof atualizarNotaSchema>;
export type ListarNotaQueryDto = z.infer<typeof listarNotaQuerySchema>;
export type NotaResponseDto = z.infer<typeof notaResponseSchema>;
export type ListaNotasResponseDto = z.infer<typeof listaNotasResponseSchema>;
