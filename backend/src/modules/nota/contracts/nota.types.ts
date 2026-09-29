import type {
  AtualizarNotaDto,
  CriarNotaDto,
  FusoHorarioBrasil,
  nota,
} from '@fluy/schema';
import type { PaginaResultado } from '@/shared/paginacao/paginacao.utils';

export type NotaPersistida = typeof nota.$inferSelect;

export type BuscarNotaInput = {
  id: string;
  salaoId: string;
};

export type AtualizarNotaInput = BuscarNotaInput & {
  dados: AtualizarNotaDto;
};

export type CriarNotaInput = {
  dados: CriarNotaDto;
  salaoId: string;
  usuarioSalaoId: string | null;
};

export type CriarNotaPersistenciaInput = {
  dados: CriarNotaDto;
  autorId: string;
};

export type ListarNotaInput = {
  salaoId: string;
  clienteId?: string;
  agendamentoId?: string;
  cursor?: string;
};

export type ListarNotaPersistenciaInput = Omit<ListarNotaInput, 'cursor'> & {
  offset: number;
  limite: number;
};

export type PossuiAgendamentoDaClienteInput = {
  agendamentoId: string;
  clienteId: string;
  salaoId: string;
};

export type ListaNotasResultado = PaginaResultado<NotaPersistida> & {
  fusoHorario: FusoHorarioBrasil;
};
