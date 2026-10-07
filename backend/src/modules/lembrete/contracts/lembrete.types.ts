import type {
  AtualizarLembreteDto,
  CriarLembreteDto,
  FusoHorarioBrasil,
  lembrete,
  OrigemLembrete,
  PeriodoLembrete,
} from '@fluy/schema';
import type { PaginaResultado } from '@/shared/paginacao/paginacao.utils';

export type LembretePersistido = typeof lembrete.$inferSelect;

export type ClienteDoLembretePersistida = {
  id: string;
  nome: string;
};

export type LembreteComClientePersistido = LembretePersistido & {
  cliente: ClienteDoLembretePersistida;
};

export type BuscarLembreteInput = {
  id: string;
  salaoId: string;
};

export type CriarLembreteInput = {
  dados: CriarLembreteDto;
  salaoId: string;
  usuarioSalaoId: string | null;
};

export type CriarLembretePersistenciaInput = {
  dados: CriarLembreteDto;
  autorId: string;
};

export type AtualizarLembreteInput = BuscarLembreteInput & {
  dados: AtualizarLembreteDto;
};

export type AtualizarLembretePersistenciaInput = AtualizarLembreteInput & {
  reiniciarNotificacao: boolean;
};

export type ConcluirLembretePersistenciaInput = BuscarLembreteInput & {
  concluidoEm: Date;
};

export type ListarLembreteInput = {
  salaoId: string;
  periodo?: PeriodoLembrete;
  origem?: OrigemLembrete;
  busca?: string;
  clienteId?: string;
  agendamentoId?: string;
  cursor?: string;
};

// Limites inclusivos de `data_alvo`, em data civil do salão.
export type JanelaDataAlvo = {
  inicio?: string;
  fim?: string;
};

export type ListarLembretePersistenciaInput = Omit<
  ListarLembreteInput,
  'cursor' | 'periodo'
> & {
  janela: JanelaDataAlvo;
  offset: number;
  limite: number;
};

export type PossuiAgendamentoDaClienteInput = {
  agendamentoId: string;
  clienteId: string;
  salaoId: string;
};

export type ListaLembretesResultado =
  PaginaResultado<LembreteComClientePersistido> & {
    fusoHorario: FusoHorarioBrasil;
  };

export type LembreteVencidoPersistido = {
  id: string;
  salaoId: string;
  texto: string;
  cliente: ClienteDoLembretePersistida;
};

export type ListarLembretesVencidosInput = {
  salaoId?: string;
  limite: number;
};

export type MarcarLembreteNotificadoInput = BuscarLembreteInput & {
  notificadoEm: Date;
};
