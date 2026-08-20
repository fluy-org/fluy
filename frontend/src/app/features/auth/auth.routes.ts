import { Routes } from '@angular/router';
import { conclusaoCadastroGuard } from '../../core/guards/conclusao-cadastro.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'cadastro',
    loadComponent: () =>
      import('./pages/cadastro/cadastro.page').then((m) => m.CadastroPage),
  },
  {
    path: 'concluir-cadastro',
    canActivate: [conclusaoCadastroGuard],
    loadComponent: () =>
      import('./pages/concluir-cadastro/concluir-cadastro.page')
        .then((m) => m.ConcluirCadastroPage),
  },
];
