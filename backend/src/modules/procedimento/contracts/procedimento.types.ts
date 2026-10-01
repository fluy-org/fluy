import type {
  AtualizarProcedimentoDto,
  CriarProcedimentoDto,
  imagemProcedimento,
  procedimento,
  TipoSinal,
} from '@fluy/schema';

export type ProcedimentoPersistido = typeof procedimento.$inferSelect & {
  imagem: typeof imagemProcedimento.$inferSelect | null;
};

export type ProcedimentoComImagem = Pick<
  typeof procedimento.$inferSelect,
  'id' | 'salao_id'
> & {
  imagem: Pick<
    typeof imagemProcedimento.$inferSelect,
    'procedimento_id'
  > | null;
};

export type ProcedimentoPublicoPersistido = Pick<
  typeof procedimento.$inferSelect,
  'nome' | 'descricao' | 'info_pre_procedimento' | 'duracao_min' | 'preco'
> &
  ProcedimentoComImagem;

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

export type AtualizarProcedimentoPersistenciaInput =
  AtualizarProcedimentoInput & {
    imagemExistente: ProcedimentoPersistido['imagem'];
  };

export type DesativarProcedimentoInput = BuscarProcedimentoInput & {
  imagemExistente: ProcedimentoPersistido['imagem'];
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
