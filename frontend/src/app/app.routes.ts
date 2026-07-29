import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'locais',
    loadComponent: () => import('./local/local-list/local-list').then((m) => m.LocalList),
  },
  {
    path: 'locais/:localId/pontos',
    loadComponent: () => import('./ponto/ponto-list/ponto-list').then((m) => m.PontoList),
  },
];
