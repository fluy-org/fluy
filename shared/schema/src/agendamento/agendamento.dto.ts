import type { z } from 'zod';
import type {
  agendaDiaResponseSchema,
  agendamentoAgendaResponseSchema,
  agendamentoDetalheResponseSchema,
  agendamentoResponseSchema,
  avaliacaoHorarioAgendamentoResponseSchema,
  avaliarHorarioAgendamentoQuerySchema,
  avaliarHorarioRemarcacaoQuerySchema,
  cancelarAgendamentoSchema,
  concluirAgendamentoSchema,
  criarAgendamentoSchema,
  criarAgendamentoPublicoSchema,
  horariosLivresResponseSchema,
  listarAgendaDiaQuerySchema,
  listarHorariosLivresQuerySchema,
  listarHorariosLivresPublicosQuerySchema,
  listarHorariosLivresRemarcacaoQuerySchema,
  listarResumoAgendaQuerySchema,
  remarcarAgendamentoSchema,
  resumoAgendaResponseSchema,
} from './agendamento.schema.js';

export type ListarHorariosLivresQueryDto = z.infer<
  typeof listarHorariosLivresQuerySchema
>;
export type ListarHorariosLivresPublicosQueryDto = z.infer<
  typeof listarHorariosLivresPublicosQuerySchema
>;
export type AvaliarHorarioAgendamentoQueryDto = z.infer<
  typeof avaliarHorarioAgendamentoQuerySchema
>;
export type CriarAgendamentoDto = z.infer<typeof criarAgendamentoSchema>;
export type CriarAgendamentoPublicoDto = z.infer<
  typeof criarAgendamentoPublicoSchema
>;
export type ConcluirAgendamentoDto = z.infer<typeof concluirAgendamentoSchema>;
export type CancelarAgendamentoDto = z.infer<typeof cancelarAgendamentoSchema>;
export type RemarcarAgendamentoDto = z.infer<typeof remarcarAgendamentoSchema>;
export type ListarHorariosLivresRemarcacaoQueryDto = z.infer<
  typeof listarHorariosLivresRemarcacaoQuerySchema
>;
export type AvaliarHorarioRemarcacaoQueryDto = z.infer<
  typeof avaliarHorarioRemarcacaoQuerySchema
>;
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
