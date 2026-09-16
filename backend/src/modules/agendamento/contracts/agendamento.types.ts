import type {
  AvisoAvaliacaoAgendamento,
  BloqueioAvaliacaoAgendamento,
  StatusAvaliacaoAgendamento,
  agendamento,
} from '@fluy/schema';

export type JanelaEfetiva = {
  hora_inicio: string;
  hora_fim: string;
};

export type OcupacaoProfissional = {
  profissional_id: string;
  inicio_em: Date;
  duracao_min: number;
};

export type ProfissionalComJanelas = {
  id: string;
  janelas: JanelaEfetiva[];
};

export type AvaliarHorarioAgendamentoInput = {
  data: string;
  horaInicio: string;
  duracaoMin: number;
  fusoHorario: string;
  granularidadeMin: number;
  antecedenciaMinHoras: number;
  antecedenciaMaxDias: number;
  agora: Date;
  profissionais: ProfissionalComJanelas[];
  ocupacoes: OcupacaoProfissional[];
};

export type AvaliacaoHorarioAgendamento = {
  status: StatusAvaliacaoAgendamento;
  avisos: AvisoAvaliacaoAgendamento[];
  bloqueios: BloqueioAvaliacaoAgendamento[];
  profissionalId: string | undefined;
};

export type ListarHorariosLivresInput = Omit<
  AvaliarHorarioAgendamentoInput,
  'horaInicio'
>;

export type DadosParaAvaliacaoHorario = {
  configuracao: {
    granularidade_min: number;
    antecedencia_min_horas: number;
    antecedencia_max_dias: number;
  };
  fusoHorario: string;
  ocupacoes: OcupacaoProfissional[];
  procedimento: {
    id: string;
    duracao_min: number;
    preco: string;
    tipo_sinal: 'percentual' | 'fixo';
    valor_sinal: string;
  };
  profissionais: ProfissionalComJanelas[];
};

export type CriarAgendamentoPersistenciaInput = {
  salaoId: string;
  clienteId: string;
  procedimentoId: string;
  profissionalId: string;
  inicioEm: Date;
  duracaoMin: number;
  precoTotal: string;
  valorSinal: string;
};

export type AgendamentoPersistido = typeof agendamento.$inferSelect;

export type CriarAgendamentoComValidacaoInput =
  CriarAgendamentoPersistenciaInput & {
    dataAgendamento: string;
  };

export type ValidarCriacaoAgendamentoInput = {
  avaliacao: AvaliacaoHorarioAgendamento;
  confirmarExcecoes: boolean;
};
