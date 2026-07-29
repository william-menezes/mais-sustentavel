import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Local, LocalRequest } from './local.model';

/**
 * Consome a API de Local (/api/locais) com `withCredentials` (sessão por cookie).
 * As escritas dependem do token CSRF, adicionado automaticamente pelo HttpClient
 * (cookie XSRF-TOKEN → header X-XSRF-TOKEN). Em dev, o proxy encaminha /api ao backend.
 */
@Injectable({ providedIn: 'root' })
export class LocalService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/locais';

  listar(arquivados = false): Observable<Local[]> {
    return this.http.get<Local[]>(this.base, {
      params: { arquivados },
      withCredentials: true,
    });
  }

  criar(requisicao: LocalRequest): Observable<Local> {
    return this.http.post<Local>(this.base, requisicao, { withCredentials: true });
  }

  editar(id: string, requisicao: LocalRequest): Observable<Local> {
    return this.http.put<Local>(`${this.base}/${id}`, requisicao, { withCredentials: true });
  }

  arquivar(id: string): Observable<Local> {
    return this.http.post<Local>(`${this.base}/${id}/arquivar`, {}, { withCredentials: true });
  }

  reativar(id: string): Observable<Local> {
    return this.http.post<Local>(`${this.base}/${id}/reativar`, {}, { withCredentials: true });
  }
}
