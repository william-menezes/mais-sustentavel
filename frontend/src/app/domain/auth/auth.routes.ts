import { Routes } from '@angular/router';

/** Rotas do domínio de Autenticação, montadas em `/login`. */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.Login),
  },
];
