import type { AgendamentoAgendaResponseDto } from '@fluy/schema';

export type EstadoPaginaAgenda =
  | 'carregando'
  | 'offline'
  | 'erro'
  | 'vazio'
  | 'lista';

export type EstadoPaginaDetalhe = 'carregando' | 'offline' | 'erro' | 'detalhe';

export type DiaDaGrade = {
  data: string;
  dia: number;
  total: number;
};

export type GradeDoMes = (DiaDaGrade | null)[];

export type GruposDaAgenda = {
  ativos: AgendamentoAgendaResponseDto[];
  encerrados: AgendamentoAgendaResponseDto[];
};
