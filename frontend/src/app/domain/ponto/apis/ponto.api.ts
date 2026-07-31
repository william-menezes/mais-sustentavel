import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApi } from '@shared/apis/base.api';
import { Ponto, PontoRequest } from '../interfaces/ponto.interface';

/**
 * Consome a API de Ponto. O recurso é `/api/pontos`, mas criar e listar por local são aninhados
 * no Local (`/api/locais/:localId/pontos`) — por isso essas duas montam a URL do pai.
 * Sessão e CSRF vêm da {@link BaseApi}.
 */
@Injectable({ providedIn: 'root' })
export class PontoService extends BaseApi<Ponto> {
  constructor() {
    super('/api/pontos');
  }

  /**
   * Estações de **todos** os locais, para a visão geral. Uma chamada só: o nome do local vem na
   * resposta, então a lista não precisa consultar nada por linha.
   */
  listarTodos(arquivados = false): Observable<Ponto[]> {
    return this.buscar<Ponto[]>(this.url(), { arquivados });
  }

  /** Estações de um local — usada pela ficha do Local. */
  listar(localId: string, arquivados = false): Observable<Ponto[]> {
    return this.buscar<Ponto[]>(this.urlDoLocal(localId), { arquivados });
  }

  /** Cadastra a estação. O corpo é obrigatório desde a 007: a referência é exigida (FR-011). */
  criar(localId: string, dados: PontoRequest): Observable<Ponto> {
    return this.enviar(this.urlDoLocal(localId), dados);
  }

  /** Altera **somente** a referência. Trocar de local não é permitido (RN-G-05). */
  editar(id: string, dados: PontoRequest): Observable<Ponto> {
    return this.substituir(this.url(`/${id}`), dados);
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
