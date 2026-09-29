import type { WritableSignal } from '@angular/core';
import type { NotaResponseDto } from '@fluy/schema';

export type ListaNotasDoEscopo = {
  notas: WritableSignal<NotaResponseDto[]>;
  proximoCursor: WritableSignal<string | null>;
};
