import type { AnexoAgendamentoResponseDto } from '@fluy/schema';

export type AnexoAgendamentoVisual = AnexoAgendamentoResponseDto & {
  url: string;
};
