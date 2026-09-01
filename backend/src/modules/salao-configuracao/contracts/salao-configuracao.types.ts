import type {
  AtualizarConfiguracaoSalaoDto,
  configuracaoSalao,
} from '@fluy/schema';

export type SalaoConfiguracaoPersistida = typeof configuracaoSalao.$inferSelect;

export type AtualizarSalaoConfiguracaoInput = {
  dados: AtualizarConfiguracaoSalaoDto;
  salaoId: string;
};

export type ValidarAtualizacaoSalaoConfiguracaoInput = {
  configuracao: SalaoConfiguracaoPersistida;
  dados: AtualizarConfiguracaoSalaoDto;
};
