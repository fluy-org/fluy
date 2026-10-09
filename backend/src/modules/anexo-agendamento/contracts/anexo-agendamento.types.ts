import type { anexoAgendamento, arquivo } from '@fluy/schema';
import type { ArquivoRecebido } from '@/modules/arquivo/contracts';
import type { VisibilidadeAnexo } from '@fluy/schema';
import type { PaginaResultado } from '@/shared/paginacao/paginacao.utils';

export type AnexoAgendamentoPersistido = typeof anexoAgendamento.$inferSelect;
export type ArquivoDoAnexoPersistido = Pick<
  typeof arquivo.$inferSelect,
  'id' | 'mime_type' | 'tamanho_bytes' | 'url_storage'
>;

export type AnexoAgendamentoComArquivoPersistido =
  AnexoAgendamentoPersistido & {
    arquivo: ArquivoDoAnexoPersistido;
  };

export type EscopoAgendamentoDoSalao = {
  agendamentoId: string;
  salaoId: string;
};

export type BuscarAnexoInternoInput = EscopoAgendamentoDoSalao & {
  id: string;
};

export type CriarAnexoInternoInput = EscopoAgendamentoDoSalao & {
  arquivo: ArquivoRecebido | undefined;
};

export type CriarAnexoInternoPersistenciaInput = EscopoAgendamentoDoSalao & {
  arquivo: ArquivoDoAnexoPersistido;
};

export type CriarAnexoInternoPersistenciaResultado =
  | {
      status: 'criado';
      anexo: AnexoAgendamentoComArquivoPersistido;
    }
  | {
      status: 'agendamento_nao_encontrado';
    }
  | {
      status: 'arquivo_nao_encontrado';
    }
  | {
      status: 'limite_atingido';
    };

export type EscopoAgendamentoDaCliente = EscopoAgendamentoDoSalao & {
  clienteId: string;
};

export type BuscarReferenciaDaClienteInput = EscopoAgendamentoDaCliente & {
  id: string;
};

export type BuscarReferenciaDoSalaoInput = EscopoAgendamentoDoSalao & {
  id: string;
};

export type CriarReferenciaInput = EscopoAgendamentoDaCliente & {
  arquivo: ArquivoRecebido | undefined;
};

export type CriarReferenciaPersistenciaInput = EscopoAgendamentoDaCliente & {
  arquivo: ArquivoDoAnexoPersistido;
};

export type CriarReferenciaPersistenciaResultado =
  CriarAnexoInternoPersistenciaResultado;

export type ListarAnexosClienteInput = {
  clienteId: string;
  salaoId: string;
  visibilidade: VisibilidadeAnexo;
  cursor?: string;
};

export type ListarAnexosClientePersistenciaInput = Omit<
  ListarAnexosClienteInput,
  'cursor'
> & {
  limite: number;
  offset: number;
};

export type ListaAnexosClienteResultado =
  PaginaResultado<AnexoAgendamentoComArquivoPersistido>;

export type BuscarAnexoDaClientePeloSalaoInput = {
  id: string;
  clienteId: string;
  salaoId: string;
};
