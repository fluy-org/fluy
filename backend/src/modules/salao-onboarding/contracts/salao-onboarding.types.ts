import type { CriarSalaoDto, salao } from '@fluy/schema';

export type SalaoPersistido = typeof salao.$inferSelect;

export type CriarSalaoPersistenciaInput = CriarSalaoDto & {
  usuarioId: string;
  nomeProfissional: string;
};

export type ResultadoCriarOuObterSalao = {
  salao: SalaoPersistido;
  criado: boolean;
};
