import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AutenticacaoService } from '@domain/auth/services/autenticacao.service';

/**
 * Ao receber 401 (sessão ausente/expirada) em endpoints protegidos, limpa o espelho
 * de sessão e redireciona ao login. Os próprios endpoints de autenticação
 * (/api/auth/*) tratam seus 401 localmente (mensagem genérica), por isso são
 * excluídos daqui (research D10).
 */
export const autenticacaoErroInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() precisa rodar no contexto de injeção (corpo do interceptor), não no
  // callback assíncrono do catchError.
  const router = inject(Router);
  const autenticacao = inject(AutenticacaoService);
  return next(req).pipe(
    catchError((erro: unknown) => {
      const status = (erro as { status?: number })?.status;
      if (status === 401 && !req.url.includes('/api/auth/')) {
        // O servidor recusou: o espelho estava otimista, então desfaz antes de sair.
        autenticacao.marcarAutenticado(false);
        void router.navigateByUrl('/login');
      }
      return throwError(() => erro);
    }),
  );
};
