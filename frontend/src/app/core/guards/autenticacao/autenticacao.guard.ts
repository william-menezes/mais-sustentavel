import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacaoService } from '@domain/auth/services/autenticacao.service';

/**
 * Barra as rotas do painel quando não há sessão conhecida no cliente, enviando ao
 * login com a rota pretendida em `retorno`.
 *
 * É um portão otimista: a sessão real é um cookie HttpOnly, invisível ao JS, então o
 * guard consulta o espelho mantido pelo {@link AutenticacaoService}. A autoridade
 * continua no servidor — se o cookie tiver expirado, a API responde 401 e o
 * autenticacaoErroInterceptor limpa o espelho e traz de volta ao login.
 */
export const autenticacaoGuard: CanActivateFn = (_rota, estado) => {
  const autenticacao = inject(AutenticacaoService);
  const router = inject(Router);

  if (autenticacao.autenticado()) {
    return true;
  }

  void router.navigate(['/login'], { queryParams: { retorno: estado.url } });
  return false;
};
