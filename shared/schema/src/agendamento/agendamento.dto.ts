import type { z } from 'zod';
import type {
  agendamentoResponseSchema,
  avaliacaoHorarioAgendamentoResponseSchema,
  avaliarHorarioAgendamentoQuerySchema,
  criarAgendamentoSchema,
  horariosLivresResponseSchema,
  listarHorariosLivresQuerySchema,
} from './agendamento.schema.js';

export type ListarHorariosLivresQueryDto = z.infer<
  typeof listarHorariosLivresQuerySchema
>;
export type AvaliarHorarioAgendamentoQueryDto = z.infer<
  typeof avaliarHorarioAgendamentoQuerySchema
>;
export type CriarAgendamentoDto = z.infer<typeof criarAgendamentoSchema>;
export type HorariosLivresResponseDto = z.infer<
  typeof horariosLivresResponseSchema
>;
export type AvaliacaoHorarioAgendamentoResponseDto = z.infer<
  typeof avaliacaoHorarioAgendamentoResponseSchema
>;
export type AgendamentoResponseDto = z.infer<
  typeof agendamentoResponseSchema
>;
