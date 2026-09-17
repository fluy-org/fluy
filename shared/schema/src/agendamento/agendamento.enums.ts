export const ESTADO_AGENDAMENTO = [
  'reservado',
  'agendado',
  'concluido',
  'cancelado',
  'falta',
] as const;
export type EstadoAgendamento = (typeof ESTADO_AGENDAMENTO)[number];

export const STATUS_AVALIACAO_AGENDAMENTO = [
  'disponivel',
  'requer_confirmacao',
  'indisponivel',
] as const;
export type StatusAvaliacaoAgendamento =
  (typeof STATUS_AVALIACAO_AGENDAMENTO)[number];

export const AVISO_AVALIACAO_AGENDAMENTO = [
  'fora_janela',
  'inicio_passado',
  'antes_antecedencia_minima',
  'apos_antecedencia_maxima',
] as const;
export type AvisoAvaliacaoAgendamento =
  (typeof AVISO_AVALIACAO_AGENDAMENTO)[number];

export const ACAO_AGENDAMENTO = [
  'concluir',
  'cancelar',
  'remarcar',
  'marcar_falta',
] as const;
export type AcaoAgendamento = (typeof ACAO_AGENDAMENTO)[number];

export const AVISO_ACAO_AGENDAMENTO = ['falta_antes_da_tolerancia'] as const;
export type AvisoAcaoAgendamento = (typeof AVISO_ACAO_AGENDAMENTO)[number];

export const BLOQUEIO_AVALIACAO_AGENDAMENTO = [
  'fora_da_grade',
  'sem_profissional_disponivel',
  'cruza_meia_noite',
] as const;
export type BloqueioAvaliacaoAgendamento =
  (typeof BLOQUEIO_AVALIACAO_AGENDAMENTO)[number];
