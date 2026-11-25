import type { EtapaPrimeirosPassos } from './primeiros-passos.enums';

export interface ItemChecklistPrimeirosPassos {
  id: EtapaPrimeirosPassos;
  titulo: string;
  descricao: string;
  concluido: boolean;
  obrigatorio: boolean;
}
