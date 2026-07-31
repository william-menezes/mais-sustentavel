import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '@shared/apis/base.api';
import { Ponto } from '../interfaces/ponto.interface';

/**
 * Consome a API de Ponto. O recurso é `/api/pontos`, mas criar/listar são aninhados
 * no Local (`/api/locais/:localId/pontos`) — por isso essas duas montam a URL do pai.
 * Sessão e CSRF vêm da {@link BaseApi}.
 */
@Injectable({ providedIn: 'root' })
export class PontoService extends BaseApi<Ponto> {
  constructor() {
    super('/api/pontos');
  }

  listar(localId: string, arquivados = false): Observable<Ponto[]> {
    return this.buscar<Ponto[]>(this.urlDoLocal(localId), { arquivados });
  }

  criar(localId: string): Observable<Ponto> {
    return this.enviar(this.urlDoLocal(localId));
  }

  arquivar(id: string): Observable<Ponto> {
    return this.enviar(this.url(`/${id}/arquivar`));
  }

  reativar(id: string): Observable<Ponto> {
    return this.enviar(this.url(`/${id}/reativar`));
  }

  /** URL da imagem PNG do QR (same-origin: o navegador envia o cookie de sessão). */
  qrUrl(id: string): string {
    return this.url(`/${id}/qr`);
  }

  /** Coleção de pontos aninhada no Local. */
  private urlDoLocal(localId: string): string {
    return `/api/locais/${localId}/pontos`;
  }
}
