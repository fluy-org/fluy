import type { WritableSignal } from '@angular/core';
import type {
  LembreteResponseDto,
  ListarLembreteQueryDto,
} from '@fluy/schema';

export type FiltrosListaLembretes = Pick<
  ListarLembreteQueryDto,
  'periodo' | 'origem' | 'busca'
>;

export type EstadoPaginaLembretes =
  | 'carregando'
  | 'erro'
  | 'vazio'
  | 'sem-resultados'
  | 'lista';

export type ListaLembretesDoEscopo = {
  lembretes: WritableSignal<LembreteResponseDto[]>;
  proximoCursor: WritableSignal<string | null>;
};
