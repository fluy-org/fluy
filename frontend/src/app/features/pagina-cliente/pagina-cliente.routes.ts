import { Routes } from '@angular/router';

export const PAGINA_CLIENTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pagina-cliente/pagina-cliente.page').then((m) => m.PaginaClientePage),
  },
];
