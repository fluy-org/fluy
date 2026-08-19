import { Routes } from '@angular/router';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cadastro/cadastro.page').then((m) => m.CadastroPage),
  },
];
