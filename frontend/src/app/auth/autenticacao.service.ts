import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface LoginResponse {
  nome: string;
  papeis: string[];
}

/**
 * Serviço de autenticação. Consome a API (POST /api/auth/*) com `withCredentials`
 * para manter a sessão por cookie. Em dev, `/api` é redirecionado ao backend
 * (proxy.conf.json → http://localhost:8080).
 */
@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  private readonly http = inject(HttpClient);

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      '/api/auth/login',
      { email, senha },
      { withCredentials: true },
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, { withCredentials: true });
  }
}
