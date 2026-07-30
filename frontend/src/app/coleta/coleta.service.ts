import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Coleta, ColetaRequest, ColetasDoPonto } from './coleta.model';

/**
 * Consome a API de Coleta (aninhada no Ponto). `withCredentials` para a sessão;
 * o token CSRF é adicionado pelo HttpClient na escrita.
 */
@Injectable({ providedIn: 'root' })
export class ColetaService {
  private readonly http = inject(HttpClient);

  listar(pontoId: string): Observable<ColetasDoPonto> {
    return this.http.get<ColetasDoPonto>(`/api/pontos/${pontoId}/coletas`, { withCredentials: true });
  }

  registrar(pontoId: string, requisicao: ColetaRequest): Observable<Coleta> {
    return this.http.post<Coleta>(`/api/pontos/${pontoId}/coletas`, requisicao, { withCredentials: true });
  }
}
