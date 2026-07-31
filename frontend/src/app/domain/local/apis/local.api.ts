import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '@shared/apis/base.api';
import { Local, LocalRequest } from '../interfaces/local.interface';

/**
 * Consome a API de Local (/api/locais). Sessão, CSRF e composição de URL vêm da
 * {@link BaseApi}. Arquivar/reativar são o soft delete do recurso.
 */
@Injectable({ providedIn: 'root' })
export class LocalService extends BaseApi<Local> {
  constructor() {
    super('/api/locais');
  }

  listar(arquivados = false): Observable<Local[]> {
    return this.buscar<Local[]>(this.url(), { arquivados });
  }

  criar(requisicao: LocalRequest): Observable<Local> {
    return this.enviar(this.url(), requisicao);
  }

  editar(id: string, requisicao: LocalRequest): Observable<Local> {
    return this.substituir(this.url(`/${id}`), requisicao);
  }

  arquivar(id: string): Observable<Local> {
    return this.enviar(this.url(`/${id}/arquivar`));
  }

  reativar(id: string): Observable<Local> {
    return this.enviar(this.url(`/${id}/reativar`));
  }
}
