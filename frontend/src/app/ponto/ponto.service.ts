import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Ponto } from './ponto.model';

/**
 * Consome a API de Ponto (aninhada no Local para criar/listar; flat para item).
 * `withCredentials` para a sessão; o token CSRF é adicionado pelo HttpClient nas escritas.
 */
@Injectable({ providedIn: 'root' })
export class PontoService {
  private readonly http = inject(HttpClient);

  listar(localId: string, arquivados = false): Observable<Ponto[]> {
    return this.http.get<Ponto[]>(`/api/locais/${localId}/pontos`, {
      params: { arquivados },
      withCredentials: true,
    });
  }

  criar(localId: string): Observable<Ponto> {
    return this.http.post<Ponto>(`/api/locais/${localId}/pontos`, {}, { withCredentials: true });
  }

  arquivar(id: string): Observable<Ponto> {
    return this.http.post<Ponto>(`/api/pontos/${id}/arquivar`, {}, { withCredentials: true });
  }

  reativar(id: string): Observable<Ponto> {
    return this.http.post<Ponto>(`/api/pontos/${id}/reativar`, {}, { withCredentials: true });
  }

  /** URL da imagem PNG do QR (same-origin: o navegador envia o cookie de sessão). */
  qrUrl(id: string): string {
    return `/api/pontos/${id}/qr`;
  }
}
