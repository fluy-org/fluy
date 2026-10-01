import type { OrigemLembrete, PeriodoLembrete } from '@fluy/schema';
import type { FiltrosListaLembretes } from './contracts';

export const FILTROS_PADRAO_LISTA_LEMBRETES: FiltrosListaLembretes = {};

export const ROTULO_PERIODO_LEMBRETE: Record<PeriodoLembrete, string> = {
  hoje: 'Hoje',
  semana: 'Próximos 7 dias',
  mes: 'Próximos 30 dias',
  atrasados: 'Atrasados',
};

export const ROTULO_ORIGEM_LEMBRETE: Record<OrigemLembrete, string> = {
  automatica: 'Automático',
  manual: 'Manual',
};
