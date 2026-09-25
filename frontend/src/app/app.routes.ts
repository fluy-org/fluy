import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AuthenticatedLayoutComponent } from './layouts/authenticated/authenticated-layout.component';
import { PublicLayoutComponent } from './layouts/public/public-layout.component';

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
