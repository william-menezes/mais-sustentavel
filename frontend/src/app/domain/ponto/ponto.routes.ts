import { Routes } from '@angular/router';

/** Rotas do domínio de Ponto, montadas em `/locais/:localId/pontos` (aninhado no Local). */
export const PONTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pontos/pontos.page').then((m) => m.PontoList),
  },
];
