import type {
  OrdenacaoCliente,
  SegmentoCliente,
  StatusFiltroCliente,
} from '@fluy/schema';
import type { FiltrosListaClientes } from './contracts';

export const FILTROS_PADRAO_LISTA_CLIENTES: FiltrosListaClientes = {
  status: 'ativos',
  segmento: 'todas',
  ordenacao: 'nome',
};

export const ROTULO_STATUS_FILTRO_CLIENTE: Record<StatusFiltroCliente, string> =
  {
    ativos: 'Ativos',
    inativos: 'Inativos',
    todos: 'Todos',
  };

export const ROTULO_SEGMENTO_CLIENTE: Record<SegmentoCliente, string> = {
  todas: 'Todas',
  atendidas_30_dias: 'Atendidas nos últimos 30 dias',
  novas: 'Novas (últimos 30 dias)',
};

export const ROTULO_ORDENACAO_CLIENTE: Record<OrdenacaoCliente, string> = {
  nome: 'Nome (A–Z)',
  ultimo_atendimento: 'Último atendimento',
  maior_valor_gasto: 'Maior valor gasto',
};
