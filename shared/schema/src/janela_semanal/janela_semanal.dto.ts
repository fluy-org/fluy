import type { z } from 'zod';
import type {
  atualizarDisponibilidadeSemanalSchema,
  disponibilidadeSemanalResponseSchema,
} from './janela_semanal.schema.js';

export type AtualizarDisponibilidadeSemanalDto = z.infer<
  typeof atualizarDisponibilidadeSemanalSchema
>;
export type DisponibilidadeSemanalResponseDto = z.infer<
  typeof disponibilidadeSemanalResponseSchema
>;
