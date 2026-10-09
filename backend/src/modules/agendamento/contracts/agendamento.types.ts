import type {
  AcaoAgendamento,
  AvisoAcaoAgendamento,
  AvisoAvaliacaoAgendamento,
  BloqueioAvaliacaoAgendamento,
  CancelarAgendamentoDto,
  ConcluirAgendamentoDto,
  FusoHorarioBrasil,
  MetodoPagamentoManual,
  RemarcarAgendamentoDto,
  StatusAvaliacaoAgendamento,
  StatusCobrancaGateway,
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
  fechado: boolean;
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
  bloquearInicioPassado?: boolean;
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
  fusoHorario: string;
  bloquearProcedimentoDuplicadoNoDia?: boolean;
};

export type PossuiAgendamentoDoProcedimentoNoDiaInput = {
  salaoId: string;
  clienteId: string;
  procedimentoId: string;
  data: string;
  fusoHorario: string;
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

export type ValidarConclusaoAgendamentoInput = {
  estado: AgendamentoPersistido['estado'];
  valorPendente: string;
  metodoPagamento: MetodoPagamentoManual | null;
};

export type ConcluirAgendamentoInput = {
  id: string;
  salaoId: string;
  usuarioSalaoId: string | null;
  dados: ConcluirAgendamentoDto;
};

export type CobrancaManualDaConclusao = {
  valor: string;
  metodo: MetodoPagamentoManual;
  registradaPor: string;
};

export type LembreteDaConclusao = {
  texto: string;
  dataAlvo: string;
};

export type ConcluirAgendamentoPersistenciaInput = {
  id: string;
  salaoId: string;
  ocorreuEm: Date;
  cobranca: CobrancaManualDaConclusao | undefined;
  lembrete: LembreteDaConclusao | undefined;
};

export type ValidarFaltaAgendamentoInput = {
  estado: AgendamentoPersistido['estado'];
  inicioEm: Date;
  agora: Date;
};

export type ValidarCancelamentoAgendamentoInput = {
  estado: AgendamentoPersistido['estado'];
};

export type MarcarFaltaAgendamentoInput = {
  id: string;
  salaoId: string;
};

export type MarcarFaltaAgendamentoPersistenciaInput = {
  id: string;
  salaoId: string;
  ocorreuEm: Date;
};

export type CancelarAgendamentoInput = {
  id: string;
  salaoId: string;
  dados: CancelarAgendamentoDto;
  notificarCliente?: boolean;
};

export type CancelarAgendamentoPersistenciaInput = {
  id: string;
  salaoId: string;
  ocorreuEm: Date;
  motivo: string | undefined;
};

export type RemarcarAgendamentoInput = {
  id: string;
  salaoId: string;
  dados: RemarcarAgendamentoDto;
};

export type AvaliarRemarcacaoInput = {
  id: string;
  salaoId: string;
  data: string;
  horaInicio: string;
};

export type ValidarRemarcacaoAgendamentoInput = {
  estado: AgendamentoPersistido['estado'];
  inicioEmAtual: Date;
  inicioEmNovo: Date;
  avaliacao: AvaliacaoHorarioAgendamento;
  confirmarExcecoes: boolean;
};

export type RemarcarAgendamentoPersistenciaInput = {
  id: string;
  salaoId: string;
  profissionalId: string;
  dataAgendamento: string;
  inicioEm: Date;
  duracaoMin: number;
  ocorreuEm: Date;
};

export type ClienteDoAgendamentoPersistida = {
  id: string;
  nome: string;
  whatsapp: string;
};

export type ProcedimentoDoAgendamentoPersistido = {
  id: string;
  nome: string;
  periodo_manutencao_dias: number | null;
};

// `status` nulo identifica cobrança manual, que não tem coluna de status:
// existir já significa que o dinheiro entrou.
export type PagamentoDoAgendamentoPersistido = {
  valor: string;
  status: StatusCobrancaGateway | null;
};

export type AgendamentoDaAgendaPersistido = AgendamentoPersistido & {
  cliente: ClienteDoAgendamentoPersistida;
  procedimento: ProcedimentoDoAgendamentoPersistido;
  pagamentos: PagamentoDoAgendamentoPersistido[];
  quantidade_anexos: number;
  tem_imagens_referencia: boolean;
  tem_observacoes: boolean;
};

export type AgendamentoDetalhePersistido = AgendamentoDaAgendaPersistido & {
  remarcado_vezes: number;
};

export type AvaliacaoDaRemarcacao = {
  agendamento: AgendamentoDetalhePersistido;
  avaliacao: AvaliacaoHorarioAgendamento;
  inicioEm: Date;
};

export type ListarAgendamentosDoDiaInput = {
  salaoId: string;
  data: string;
  fusoHorario: string;
};

export type ListarOcupacoesDoDiaInput = {
  salaoId: string;
  data: string;
  fusoHorario: string;
  ignorarAgendamentoId?: string;
};

export type ListarInstantesDoPeriodoInput = {
  salaoId: string;
  dataInicio: string;
  dataFim: string;
  fusoHorario: string;
};

export type InstanteDeAgendamentoPersistido = {
  inicio_em: Date;
};

export type ContagemPorDia = {
  data: string;
  total: number;
};

export type ResumoDaAgendaResultado = {
  dias: ContagemPorDia[];
};

export type BuscarAgendamentoInput = {
  id: string;
  salaoId: string;
};

export type AgendamentoDaAgendaResultado = AgendamentoDaAgendaPersistido & {
  valorPago: string;
  valorPendente: string;
};

export type AgendaDoDiaResultado = {
  data: string;
  fusoHorario: FusoHorarioBrasil;
  agendamentos: AgendamentoDaAgendaResultado[];
};

export type AcoesDoAgendamento = {
  acoesPermitidas: AcaoAgendamento[];
  avisos: AvisoAcaoAgendamento[];
};

export type AgendamentoDetalheResultado = AgendamentoDaAgendaResultado &
  AcoesDoAgendamento & {
    fusoHorario: FusoHorarioBrasil;
    remarcado_vezes: number;
  };

export type CalcularAcoesAgendamentoInput = {
  estado: AgendamentoPersistido['estado'];
  inicioEm: Date;
  toleranciaAtrasoMin: number;
  agora: Date;
};
