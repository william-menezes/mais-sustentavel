import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '@shared/apis/base.api';
import { Coleta, ColetaRequest, ColetasDoPonto } from '../interfaces/coleta.interface';

/**
 * Consome a API de Coleta, aninhada no Ponto (`/api/pontos/:pontoId/coletas`).
 * Sessão e CSRF vêm da {@link BaseApi}.
 */
@Injectable({ providedIn: 'root' })
export class ColetaService extends BaseApi<Coleta> {
  constructor() {
    super('/api/pontos');
  }

  listar(pontoId: string): Observable<ColetasDoPonto> {
    return this.buscar<ColetasDoPonto>(this.urlDoPonto(pontoId));
  }

  registrar(pontoId: string, requisicao: ColetaRequest): Observable<Coleta> {
    return this.enviar(this.urlDoPonto(pontoId), requisicao);
  }

  /** Coleção de coletas aninhada no Ponto. */
  private urlDoPonto(pontoId: string): string {
    return this.url(`/${pontoId}/coletas`);
  }
}
