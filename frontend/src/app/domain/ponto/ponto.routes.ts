import { Routes } from '@angular/router';

/**
 * Rotas do domínio de Ponto, montadas em `/pontos` — a visão geral de estações de todos os locais.
 *
 * Antes viviam em `/locais/:localId/pontos`, uma tela por local. A visão geral resolve aquele caso
 * (filtrar por um local) e resolve o que a aninhada não resolvia (ver a operação inteira), então
 * manter as duas só produziria divergência de filtros e ações — ver `research.md` D8.
 */
export const PONTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pontos/pontos.page').then((m) => m.PontoList),
  },
];
