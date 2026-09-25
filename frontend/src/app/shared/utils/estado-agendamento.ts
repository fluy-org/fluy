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
