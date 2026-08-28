import type {
  AtualizarProcedimentoDto,
  CriarProcedimentoDto,
  procedimento,
  TipoSinal,
} from '@fluy/schema';

export type ProcedimentoPersistido = typeof procedimento.$inferSelect;

export type BuscarProcedimentoInput = {
  id: string;
  salaoId: string;
};

export type CriarProcedimentoInput = {
  dados: CriarProcedimentoDto;
  salaoId: string;
};

export type AtualizarProcedimentoInput = {
  dados: AtualizarProcedimentoDto;
  id: string;
  salaoId: string;
};

export type ValidarAtualizacaoProcedimentoInput = {
  dados: AtualizarProcedimentoDto;
  procedimento: ProcedimentoPersistido;
};

export type DadosSinalProcedimento = {
  preco: number;
  tipoSinal: TipoSinal;
  valorSinal: number;
};
