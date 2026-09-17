import { Routes } from '@angular/router';

export const AGENDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/agenda/agenda.page').then((m) => m.AgendaPage),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import(
        '../agendamentos/pages/agendamento-manual/agendamento-manual.page'
      ).then((m) => m.AgendamentoManualPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/agendamento-detalhe/agendamento-detalhe.page').then(
        (m) => m.AgendamentoDetalhePage,
      ),
  },
];
