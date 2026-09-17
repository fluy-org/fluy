import { Routes } from '@angular/router';

export const AUTHENTICATED_ROUTES: Routes = [
  // A rota vazia dentro do painel redireciona para o dashboard/agenda.
  { path: '', redirectTo: 'agenda', pathMatch: 'full' },
  {
    path: 'agenda',
    loadChildren: () =>
      import('../../features/salao/agenda/agenda.routes').then(
        (m) => m.AGENDA_ROUTES,
      ),
  },
  // Como filha de /painel, a pagina herda o layout autenticado e o authGuard.
  {
    path: 'procedimentos',
    loadComponent: () =>
      import(
        '../../features/salao/procedimentos/pages/procedimentos/procedimentos.page'
      ).then((m) => m.ProcedimentosPage),
  },
  {
    // A configuracao pertence ao painel e reutiliza o layout autenticado.
    path: 'configuracao',
    loadComponent: () =>
      import(
        '../../features/salao/configuracao/pages/configuracao/configuracao.page'
      ).then((m) => m.ConfiguracaoPage),
  },
  {
    // A disponibilidade contem dados privados e reutiliza o layout autenticado.
    path: 'disponibilidade',
    loadComponent: () =>
      import(
        '../../features/salao/disponibilidade/pages/disponibilidade/disponibilidade.page'
      ).then((m) => m.DisponibilidadePage),
  },
];
