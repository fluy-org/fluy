import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clientes/clientes.page').then((m) => m.ClientesPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/cliente-ficha/cliente-ficha.page').then(
        (m) => m.ClienteFichaPage,
      ),
  },
];
