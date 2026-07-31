import { Routes } from '@angular/router';

/** Rotas do domínio de Local, montadas em `/locais`. */
export const LOCAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/locais/locais.page').then((m) => m.LocalList),
  },
];
