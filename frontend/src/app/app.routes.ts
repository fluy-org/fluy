import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthenticatedLayoutComponent } from './layouts/authenticated/authenticated-layout.component';
import { PublicLayoutComponent } from './layouts/public/public-layout.component';

export const routes: Routes = [
  {
    path: 'painel',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () =>
      import('./layouts/authenticated/authenticated.routes')
        .then((m) => m.AUTHENTICATED_ROUTES),
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadChildren: () =>
          import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
      {
        path: 'cadastro',
        loadChildren: () =>
          import('./features/onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
      },
      {
        path: '',
        loadChildren: () => import('./features/demo/demo.routes').then((m) => m.routes),
      },
      {
        path: ':subdominio',
        loadChildren: () =>
          import('./features/pagina-cliente/pagina-cliente.routes')
            .then((m) => m.PAGINA_CLIENTE_ROUTES),
      },
    ],
  },
];
