import { Routes } from '@angular/router';
import { Tab1Page } from '../../features/demo/pages/tab1/tab1.page';

// Placeholders para os componentes que serão criados nas fatias futuras.
// import { ConfiguracaoComponent } from '../../features/configuracao/configuracao.component';

export const AUTHENTICATED_ROUTES: Routes = [
  // A rota vazia dentro do painel redireciona para o dashboard/agenda.
  { path: '', redirectTo: 'agenda', pathMatch: 'full' },
  { path: 'agenda', component: Tab1Page },
  // Como filha de /painel, a pagina herda o layout autenticado e o authGuard.
  {
    path: 'procedimentos',
    loadComponent: () =>
      import(
        '../../features/salao/procedimentos/pages/procedimentos/procedimentos.page'
      ).then((m) => m.ProcedimentosPage),
  },
  {
    path: 'clientes',
    loadComponent: () =>
      import(
        '../../features/salao/clientes/pages/clientes/clientes.page'
      ).then((m) => m.ClientesPage),
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
