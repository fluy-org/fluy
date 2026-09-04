import type {
  AtualizarDisponibilidadeSemanalDto,
  AtualizarOverrideDisponibilidadeDto,
  janelaOverride,
  janelaSemanal,
  overrideDisponibilidade,
  profissional,
} from '@fluy/schema';

export type ProfissionalPersistido = typeof profissional.$inferSelect;
export type ProfissionalResumoPersistido = Pick<
  ProfissionalPersistido,
  'id' | 'nome' | 'ativo'
>;
export type JanelaSemanalPersistida = typeof janelaSemanal.$inferSelect;
export type JanelaOverridePersistida = typeof janelaOverride.$inferSelect;
export type OverrideDisponibilidadePersistido =
  typeof overrideDisponibilidade.$inferSelect & {
    janelas: JanelaOverridePersistida[];
  };

export type BuscarProfissionalInput = {
  profissionalId: string;
  salaoId: string;
};

export type AtualizarDisponibilidadeSemanalInput = BuscarProfissionalInput & {
  dados: AtualizarDisponibilidadeSemanalDto;
};

export type ListarOverridesDisponibilidadeInput = BuscarProfissionalInput & {
  dataFim: string;
  dataInicio: string;
};

export type AtualizarOverrideDisponibilidadeInput = BuscarProfissionalInput & {
  dados: AtualizarOverrideDisponibilidadeDto;
  data: string;
};

export type RemoverOverrideDisponibilidadeInput = BuscarProfissionalInput & {
  data: string;
};
