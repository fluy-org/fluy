import { Routes } from '@angular/router';

export const PAGINA_CLIENTE_ROUTES: Routes = [
  {
    path: 'checkout/:id',
    loadComponent: () =>
      import('./pages/checkout/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/pagina-cliente/pagina-cliente.page').then(
        (m) => m.PaginaClientePage,
      ),
  },
];
