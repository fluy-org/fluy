import { Routes } from '@angular/router';
import { conclusaoCadastroGuard } from '@app/core/guards/conclusao-cadastro.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cadastro',
    redirectTo: 'convite',
    pathMatch: 'full',
  },
  {
    path: 'convite',
    loadComponent: () =>
      import('./pages/convite/convite.page').then((m) => m.ConvitePage),
  },
  {
    path: 'concluir-cadastro',
    canActivate: [conclusaoCadastroGuard],
    loadComponent: () =>
      import('./pages/concluir-cadastro/concluir-cadastro.page').then(
        (m) => m.ConcluirCadastroPage,
      ),
  },
];
