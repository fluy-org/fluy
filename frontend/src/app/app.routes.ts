import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/demo/demo.routes').then((m) => m.routes),
  },
];
