import type { z } from 'zod';
import type {
  atualizarOverrideDisponibilidadeSchema,
  listaOverridesDisponibilidadeResponseSchema,
  listarOverridesDisponibilidadeQuerySchema,
  overrideDisponibilidadeResponseSchema,
} from './override_disponibilidade.schema.js';

export type AtualizarOverrideDisponibilidadeDto = z.infer<
  typeof atualizarOverrideDisponibilidadeSchema
>;
export type ListarOverridesDisponibilidadeQueryDto = z.infer<
  typeof listarOverridesDisponibilidadeQuerySchema
>;
export type OverrideDisponibilidadeResponseDto = z.infer<
  typeof overrideDisponibilidadeResponseSchema
>;
export type ListaOverridesDisponibilidadeResponseDto = z.infer<
  typeof listaOverridesDisponibilidadeResponseSchema
>;
