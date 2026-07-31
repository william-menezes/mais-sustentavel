import { Routes } from '@angular/router';

/** Rotas do domínio de Impacto, montadas em `/painel`. */
export const IMPACTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/painel/painel.page').then((m) => m.Painel),
  },
];
