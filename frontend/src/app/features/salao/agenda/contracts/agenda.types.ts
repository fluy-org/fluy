import type { AgendamentoAgendaResponseDto } from '@fluy/schema';

export type EstadoPaginaAgenda =
  | 'carregando'
  | 'offline'
  | 'erro'
  | 'vazio'
  | 'lista';

export type EstadoPaginaDetalhe = 'carregando' | 'offline' | 'erro' | 'detalhe';

export type GruposDaAgenda = {
  ativos: AgendamentoAgendaResponseDto[];
  encerrados: AgendamentoAgendaResponseDto[];
};
