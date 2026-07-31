import { Routes } from '@angular/router';

/** Rotas do domínio de Coleta, montadas em `/pontos/:pontoId/coletas` (aninhado no Ponto). */
export const COLETA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/coletas/coletas.page').then((m) => m.ColetaList),
  },
];
