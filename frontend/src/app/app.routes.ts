import { Routes } from '@angular/router';
import { autenticacaoGuard } from '@core/guards/autenticacao/autenticacao.guard';

export const routes: Routes = [
  // Vitrine pública, sem a casca administrativa.
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@core/pages/home/home.page').then((m) => m.Home),
  },
  {
    path: 'login',
    loadChildren: () => import('@domain/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    // Área administrativa: a casca (sidebar + header) hospeda as páginas dos domínios
    // no seu <router-outlet>. Cada domínio traz o próprio arquivo de rotas.
    path: '',
    loadComponent: () => import('@core/layout/painel/painel.layout').then((m) => m.PainelLayout),
    canActivate: [autenticacaoGuard],
    children: [
      {
        path: 'painel',
        loadChildren: () => import('@domain/impacto/impacto.routes').then((m) => m.IMPACTO_ROUTES),
      },
      // As rotas aninhadas vêm antes das coleções para casarem primeiro
      // ('pontos/:pontoId/coletas' compartilha o prefixo 'pontos').
      {
        path: 'pontos/:pontoId/coletas',
        loadChildren: () => import('@domain/coleta/coleta.routes').then((m) => m.COLETA_ROUTES),
      },
      {
        // Visão geral de estações de todos os locais. O item já existia no menu lateral e não
        // levava a lugar nenhum; substitui a antiga tela aninhada em 'locais/:localId/pontos',
        // que agora é a mesma visão geral filtrada pelo local (research D8).
        path: 'pontos',
        loadChildren: () => import('@domain/ponto/ponto.routes').then((m) => m.PONTO_ROUTES),
      },
      {
        path: 'locais',
        loadChildren: () => import('@domain/local/local.routes').then((m) => m.LOCAL_ROUTES),
      },
    ],
  },
];
