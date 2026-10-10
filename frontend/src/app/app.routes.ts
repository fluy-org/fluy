import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AuthenticatedLayoutComponent } from './layouts/authenticated/authenticated-layout.component';
import { PublicLayoutComponent } from './layouts/public/public-layout.component';

const redirecionarPwaCliente: RedirectFunction = () => {
  const router = inject(Router);

  try {
    const rota = localStorage.getItem('fluy:pwa:rota-cliente');

    if (rota && /^\/s\/[^/?#]+(?:\/.*)?$/.test(rota)) {
      return router.parseUrl(rota);
    }
  } catch {
    return router.parseUrl('/login');
  }

  return router.parseUrl('/login');
};

export const routes: Routes = [
  {
    path: 'painel',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () =>
      import('./layouts/authenticated/authenticated.routes').then(
        (m) => m.AUTHENTICATED_ROUTES,
      ),
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      ...AUTH_ROUTES,
      {
        path: 'onboarding',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/salao/onboarding/onboarding.routes').then(
            (m) => m.ONBOARDING_ROUTES,
          ),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/demo/demo.routes').then((m) => m.routes),
      },
      {
        path: 'cliente',
        pathMatch: 'full',
        redirectTo: redirecionarPwaCliente,
      },
      {
        path: 's/:subdominio',
        loadChildren: () =>
          import('./features/pagina-cliente/pagina-cliente.routes').then(
            (m) => m.PAGINA_CLIENTE_ROUTES,
          ),
      },
    ],
  },
  {
    path: 'clientes',
    loadComponent: () => import('./features/salao/clientes/pages/clientes/clientes.page').then( m => m.ClientesPage)
  },
];
