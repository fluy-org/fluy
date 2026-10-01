import type { z } from 'zod';
import type {
  atualizarLembreteSchema,
  criarLembreteSchema,
  lembreteResponseSchema,
  listaLembretesResponseSchema,
  listarLembreteQuerySchema,
} from './lembrete.schema.js';

export type CriarLembreteDto = z.infer<typeof criarLembreteSchema>;
export type AtualizarLembreteDto = z.infer<typeof atualizarLembreteSchema>;
export type ListarLembreteQueryDto = z.infer<typeof listarLembreteQuerySchema>;
export type LembreteResponseDto = z.infer<typeof lembreteResponseSchema>;
export type ListaLembretesResponseDto = z.infer<
  typeof listaLembretesResponseSchema
>;
