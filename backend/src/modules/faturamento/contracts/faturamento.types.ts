import type {
  AutorCancelamento,
  FusoHorarioBrasil,
  ListarAtendimentosFaturamentoQueryDto,
  ListarFaturamentoQueryDto,
  MetodoPagamentoGateway,
  MetodoPagamentoManual,
  MotivoSinalRetido,
  OrigemPagamento,
  TipoEventoAgendamento,
  TipoPagamentoAgendamento,
} from '@fluy/schema';
import type { PaginaResultado } from '@/shared/paginacao/paginacao.utils';

export type MetodoPagamentoFaturamento =
  MetodoPagamentoManual | MetodoPagamentoGateway;

export type PeriodoFaturamento = {
  dataInicio: string;
  dataFim: string;
};

export type IntervaloFaturamento = {
  inicio: Date;
  fim: Date;
};

export type BuscarFaturamentoInput = {
  salaoId: string;
  dados: ListarFaturamentoQueryDto;
};

export type ListarAtendimentosFaturamentoInput = {
  salaoId: string;
  dados: ListarAtendimentosFaturamentoQueryDto;
};

export type ListarEncerramentosPersistenciaInput = IntervaloFaturamento & {
  salaoId: string;
};

export type ListarAtendimentosFaturamentoPersistenciaInput =
  ListarEncerramentosPersistenciaInput & {
    offset: number;
    limite: number;
  };

export type PagamentoDoEncerramentoPersistido = {
  tipo: TipoPagamentoAgendamento;
  origem: OrigemPagamento;
  metodo: MetodoPagamentoFaturamento;
  valor_centavos: number;
};

export type EncerramentoPersistido = {
  agendamento_id: string;
  tipo: TipoEventoAgendamento;
  ocorreu_em: Date;
  cancelado_por: AutorCancelamento | null;
  preco_total_centavos: number;
  cliente: { id: string; nome: string };
  procedimento: { id: string; nome: string };
  pagamentos: PagamentoDoEncerramentoPersistido[];
};

export type PagamentoFaturamento = {
  origem: OrigemPagamento;
  metodo: MetodoPagamentoFaturamento;
  valor_centavos: number;
};

export type ResumoFaturamento = {
  total_faturado_centavos: number;
  total_concluidos: number;
  ticket_medio_centavos: number | null;
  total_pendentes: number;
};

export type SinalRetido = {
  agendamento_id: string;
  ocorreu_em: Date;
  cliente: { id: string; nome: string };
  procedimento: { id: string; nome: string };
  valor_centavos: number;
  motivo: MotivoSinalRetido;
};

export type CalculoFaturamento = {
  resumo: ResumoFaturamento;
  recebimentoPorMetodo: PagamentoFaturamento[];
  sinaisRetidos: SinalRetido[];
};

export type FaturamentoResultado = CalculoFaturamento & {
  fusoHorario: FusoHorarioBrasil;
  periodo: PeriodoFaturamento;
};

export type AtendimentoFaturamento = {
  agendamento_id: string;
  ocorreu_em: Date;
  cliente: { id: string; nome: string };
  procedimento: { id: string; nome: string };
  valor_total_centavos: number;
  sinal: PagamentoFaturamento | null;
  restante: PagamentoFaturamento | null;
  valor_pendente_centavos: number;
};

export type ListaAtendimentosFaturamentoResultado =
  PaginaResultado<AtendimentoFaturamento> & {
    fusoHorario: FusoHorarioBrasil;
  };
