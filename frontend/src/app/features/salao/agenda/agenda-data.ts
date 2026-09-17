import type { EstadoAgendamento } from '@fluy/schema';

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

export const ROTULO_ACAO_AGENDAMENTO: Record<string, string> = {
  concluir: 'Concluir atendimento',
  cancelar: 'Cancelar',
  remarcar: 'Remarcar',
  marcar_falta: 'Marcar no-show',
};

export const ROTULO_AVISO_ACAO_AGENDAMENTO: Record<string, string> = {
  falta_antes_da_tolerancia:
    'A tolerância de atraso ainda não expirou para este agendamento.',
};
