import type { z } from 'zod';
import type {
  agendaDiaResponseSchema,
  agendamentoAgendaResponseSchema,
  agendamentoDetalheResponseSchema,
  agendamentoResponseSchema,
  avaliacaoHorarioAgendamentoResponseSchema,
  avaliarHorarioAgendamentoQuerySchema,
  cancelarAgendamentoSchema,
  concluirAgendamentoSchema,
  criarAgendamentoSchema,
  horariosLivresResponseSchema,
  listarAgendaDiaQuerySchema,
  listarHorariosLivresQuerySchema,
  listarResumoAgendaQuerySchema,
  resumoAgendaResponseSchema,
} from './agendamento.schema.js';

export type ListarHorariosLivresQueryDto = z.infer<
  typeof listarHorariosLivresQuerySchema
>;
export type AvaliarHorarioAgendamentoQueryDto = z.infer<
  typeof avaliarHorarioAgendamentoQuerySchema
>;
export type CriarAgendamentoDto = z.infer<typeof criarAgendamentoSchema>;
export type ConcluirAgendamentoDto = z.infer<typeof concluirAgendamentoSchema>;
export type CancelarAgendamentoDto = z.infer<typeof cancelarAgendamentoSchema>;
export type HorariosLivresResponseDto = z.infer<
  typeof horariosLivresResponseSchema
>;
export type AvaliacaoHorarioAgendamentoResponseDto = z.infer<
  typeof avaliacaoHorarioAgendamentoResponseSchema
>;
export type AgendamentoResponseDto = z.infer<
  typeof agendamentoResponseSchema
>;
export type ListarAgendaDiaQueryDto = z.infer<
  typeof listarAgendaDiaQuerySchema
>;
export type AgendamentoAgendaResponseDto = z.infer<
  typeof agendamentoAgendaResponseSchema
>;
export type AgendaDiaResponseDto = z.infer<typeof agendaDiaResponseSchema>;
export type AgendamentoDetalheResponseDto = z.infer<
  typeof agendamentoDetalheResponseSchema
>;
export type ListarResumoAgendaQueryDto = z.infer<
  typeof listarResumoAgendaQuerySchema
>;
export type ResumoAgendaResponseDto = z.infer<
  typeof resumoAgendaResponseSchema
>;
