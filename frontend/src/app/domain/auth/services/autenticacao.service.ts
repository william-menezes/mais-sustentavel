import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { LoginResponse } from '../interfaces/autenticacao.interface';

/** Chave do espelho de sessão em localStorage. */
const CHAVE_SESSAO = 'mais-sustentavel.sessao';

/**
 * Serviço de autenticação. Consome a API (POST /api/auth/*) com `withCredentials`
 * para manter a sessão por cookie. Em dev, `/api` é redirecionado ao backend
 * (proxy.conf.json → http://localhost:8080).
 */
@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  private readonly http = inject(HttpClient);

  /**
   * Espelho da sessão, lido pelo guard de rota. O cookie de sessão é HttpOnly e
   * portanto invisível ao JS — guardamos apenas um sinalizador, que sobrevive a
   * recarga e a novas abas. Não é credencial nem autorização: quem decide é o
   * servidor. Se o cookie expirar, a API responde 401 e o
   * autenticacaoErroInterceptor limpa este espelho.
   */
  readonly autenticado = signal(this.lerEspelho());

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, senha }, { withCredentials: true })
      .pipe(tap(() => this.marcarAutenticado(true)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(tap(() => this.marcarAutenticado(false)));
  }

  /** Atualiza o espelho. Chamado no login/logout e pelo interceptor ao receber 401. */
  marcarAutenticado(ativo: boolean): void {
    this.autenticado.set(ativo);
    if (ativo) {
      localStorage.setItem(CHAVE_SESSAO, '1');
    } else {
      localStorage.removeItem(CHAVE_SESSAO);
    }
  }

  private lerEspelho(): boolean {
    return localStorage.getItem(CHAVE_SESSAO) === '1';
  }
}
