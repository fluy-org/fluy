import type {
  AcaoAgendamento,
  EstadoAgendamento,
  MetodoPagamentoManual,
} from '@fluy/schema';

type EstiloEstado = {
  rotulo: string;
  cor: string;
  corCss: string;
};

export const ESTILO_ESTADO_AGENDAMENTO: Record<EstadoAgendamento, EstiloEstado> =
  {
    reservado: {
      rotulo: 'Reservado',
      cor: 'warning',
      corCss: 'var(--fluy-color-warning)',
    },
    agendado: {
      rotulo: 'Agendado',
      cor: 'primary',
      corCss: 'var(--fluy-color-primary)',
    },
    concluido: {
      rotulo: 'Concluído',
      cor: 'success',
      corCss: 'var(--fluy-color-success)',
    },
    cancelado: {
      rotulo: 'Cancelado',
      cor: 'medium',
      corCss: 'var(--fluy-color-muted)',
    },
    falta: {
      rotulo: 'No-show',
      cor: 'danger',
      corCss: 'var(--fluy-color-danger)',
    },
  };

export const ESTADOS_ENCERRADOS: EstadoAgendamento[] = [
  'concluido',
  'cancelado',
  'falta',
];

export const ROTULOS_DIAS_DA_SEMANA = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
];

type EstiloAcao = {
  rotulo: string;
  fill: 'solid' | 'outline' | 'clear';
  cor: string;
};

// O peso visual segue a frequência e a consequência de cada ação: concluir é o
// desfecho esperado e carrega o peso da tela; as que encerram sem atendimento
// ficam recuadas para não competir com ela nem serem tocadas por engano.
export const ESTILO_ACAO_AGENDAMENTO: Record<AcaoAgendamento, EstiloAcao> = {
  concluir: {
    rotulo: 'Concluir atendimento',
    fill: 'solid',
    cor: 'primary',
  },
  remarcar: {
    rotulo: 'Remarcar',
    fill: 'outline',
    cor: 'primary',
  },
  marcar_falta: {
    rotulo: 'Marcar no-show',
    fill: 'clear',
    cor: 'medium',
  },
  cancelar: {
    rotulo: 'Cancelar agendamento',
    fill: 'clear',
    cor: 'danger',
  },
};

export const ACOES_DO_ATENDIMENTO: AcaoAgendamento[] = ['concluir', 'remarcar'];

export const ACOES_SEM_ATENDIMENTO: AcaoAgendamento[] = [
  'marcar_falta',
  'cancelar',
];

export const ROTULO_AVISO_ACAO_AGENDAMENTO: Record<string, string> = {
  falta_antes_da_tolerancia:
    'A tolerância de atraso ainda não expirou para este agendamento.',
  conclusao_antecipada:
    'Este atendimento ainda não começou. Concluir agora o lança no faturamento do período atual.',
};

export const ROTULO_METODO_PAGAMENTO_MANUAL: Record<
  MetodoPagamentoManual,
  string
> = {
  dinheiro: 'Dinheiro',
  pix_pessoal: 'PIX',
  cartao_maquina: 'Cartão na máquina',
  outro: 'Outro',
};
