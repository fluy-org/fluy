import type { Routes } from '@angular/router';

export const FATURAMENTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        '@app/features/salao/faturamento/pages/faturamento/faturamento.page'
      ).then((m) => m.FaturamentoPage),
  },
];
