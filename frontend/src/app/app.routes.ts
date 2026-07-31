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
    path: 'painel',
    loadComponent: () => import('./painel/painel').then((m) => m.Painel),
  },
  {
    path: 'locais',
    loadComponent: () => import('./local/local-list/local-list').then((m) => m.LocalList),
  },
  {
    path: 'locais/:localId/pontos',
    loadComponent: () => import('./ponto/ponto-list/ponto-list').then((m) => m.PontoList),
  },
  {
    path: 'pontos/:pontoId/coletas',
    loadComponent: () => import('./coleta/coleta-list/coleta-list').then((m) => m.ColetaList),
  },
];
