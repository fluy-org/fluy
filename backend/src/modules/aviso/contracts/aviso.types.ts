import type { TipoAviso, aviso } from '@fluy/schema';
import type { PaginaResultado } from '@/shared/paginacao/paginacao.utils';

export type AvisoPersistido = typeof aviso.$inferSelect;

export type EscopoAvisoCliente = {
  salaoId: string;
  clienteId: string;
};

export type EscopoAvisoUsuarioSalao = {
  salaoId: string;
  usuarioSalaoId: string;
};

export type ListarAvisosClienteInput = EscopoAvisoCliente & {
  cursor?: string;
};

export type ListarAvisosUsuarioSalaoInput = EscopoAvisoUsuarioSalao & {
  cursor?: string;
};

export type ListarAvisosClientePersistenciaInput = EscopoAvisoCliente & {
  offset: number;
  limite: number;
};

export type ListarAvisosUsuarioSalaoPersistenciaInput =
  EscopoAvisoUsuarioSalao & {
    offset: number;
    limite: number;
  };

export type BuscarAvisoClienteInput = EscopoAvisoCliente & { id: string };

export type BuscarAvisoUsuarioSalaoInput = EscopoAvisoUsuarioSalao & {
  id: string;
};

export type CriarAvisoInput = {
  salaoId: string;
  tipo: TipoAviso;
  titulo: string;
  mensagem: string;
  agendamentoId?: string;
  lembreteId?: string;
};

export type CriarAvisoClienteInput = CriarAvisoInput & {
  clienteId: string;
};

export type CriarAvisoUsuarioSalaoInput = CriarAvisoInput & {
  usuarioSalaoId: string;
};

export type CriarAvisoSalaoInput = CriarAvisoInput;

export type ListaAvisosResultado = PaginaResultado<AvisoPersistido>;
