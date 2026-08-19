import { Routes } from '@angular/router';
import { Tab1Page } from '../../features/demo/pages/tab1/tab1.page';

// Placeholders para os componentes que serão criados nas fatias futuras.
// import { ConfiguracaoComponent } from '../../features/configuracao/configuracao.component';

export const AUTHENTICATED_ROUTES: Routes = [
  // A rota vazia dentro do painel redireciona para o dashboard/agenda.
  { path: '', redirectTo: 'agenda', pathMatch: 'full' },
  { path: 'agenda', component: Tab1Page },
  { path: 'configuracao', redirectTo: 'agenda', pathMatch: 'full' },
  // { path: 'configuracao', component: ConfiguracaoComponent }, // Exemplo para fatia 1.5
];
