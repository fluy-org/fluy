import type { AgendamentoAgendaResponseDto } from '@fluy/schema';

export type DiaDaGrade = {
  data: string;
  dia: number;
  total?: number;
  desabilitado?: boolean;
};

export type GradeDoMes = (DiaDaGrade | null)[];

export type GruposDaAgenda = {
  ativos: AgendamentoAgendaResponseDto[];
  encerrados: AgendamentoAgendaResponseDto[];
};
