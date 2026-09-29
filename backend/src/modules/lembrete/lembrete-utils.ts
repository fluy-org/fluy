import type { PeriodoLembrete } from '@fluy/schema';
import type { JanelaDataAlvo } from '@/modules/lembrete/contracts';
import {
  DIAS_JANELA_MES_LEMBRETE,
  DIAS_JANELA_SEMANA_LEMBRETE,
} from '@/modules/lembrete/lembrete-data';
import { adicionarDiasNaData } from '@/shared/horario-salao/horario-salao.utils';

// As janelas futuras partem de hoje e não incluem atrasados: cada lembrete
// ativo aparece em um único recorte.
export function calcularJanelaDoPeriodo({
  periodo,
  hoje,
}: {
  periodo: PeriodoLembrete | undefined;
  hoje: string;
}): JanelaDataAlvo {
  switch (periodo) {
    case 'hoje':
      return { inicio: hoje, fim: hoje };
    case 'semana':
      return {
        inicio: hoje,
        fim: adicionarDiasNaData({
          data: hoje,
          dias: DIAS_JANELA_SEMANA_LEMBRETE - 1,
        }),
      };
    case 'mes':
      return {
        inicio: hoje,
        fim: adicionarDiasNaData({
          data: hoje,
          dias: DIAS_JANELA_MES_LEMBRETE - 1,
        }),
      };
    case 'atrasados':
      return { fim: adicionarDiasNaData({ data: hoje, dias: -1 }) };
    default:
      return {};
  }
}
