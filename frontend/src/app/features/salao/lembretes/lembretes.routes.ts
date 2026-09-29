import { Routes } from '@angular/router';

export const LEMBRETES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/lembretes/lembretes.page').then((m) => m.LembretesPage),
  },
];
