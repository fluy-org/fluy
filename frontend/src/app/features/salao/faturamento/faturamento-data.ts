import type {
  MotivoSinalRetido,
  OrigemPagamento,
  PagamentoFaturamentoDto,
  PresetPeriodoFaturamento,
} from '@fluy/schema';

export const PERIODO_PADRAO_FATURAMENTO: PresetPeriodoFaturamento =
  'semana_atual';

export const ROTULO_PERIODO_FATURAMENTO: Record<
  PresetPeriodoFaturamento,
  string
> = {
  semana_atual: 'Semana atual',
  semana_anterior: 'Semana anterior',
  mes_atual: 'Mês atual',
  mes_anterior: 'Mês anterior',
  quinzena_atual: 'Quinzena atual',
};

export const ROTULO_METODO_FATURAMENTO: Record<
  PagamentoFaturamentoDto['metodo'],
  string
> = {
  dinheiro: 'Dinheiro',
  pix_pessoal: 'PIX pessoal',
  cartao_maquina: 'Cartão máquina',
  outro: 'Outro',
  pix: 'PIX',
  cartao: 'Cartão',
};

export const ROTULO_ORIGEM_FATURAMENTO: Record<OrigemPagamento, string> = {
  manual: 'Manual',
  gateway: 'Online',
};

export const ROTULO_MOTIVO_SINAL_RETIDO: Record<MotivoSinalRetido, string> = {
  cancelamento_cliente: 'Cancelamento pela cliente',
  cancelamento_salao: 'Cancelamento pelo salão sem reembolso',
  falta: 'No-show',
};
