import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseApi } from '@shared/apis/base.api';
import { ValorSocialLocal } from '../interfaces/impacto.interface';

/**
 * Consome a API de impacto (/api/impacto), somente leitura. Sessão e composição de URL vêm da
 * {@link BaseApi}.
 *
 * <p>Não trata falha: quem chama decide o que fazer. A tela de Locais, por exemplo, degrada a
 * coluna de litros para "—" e segue exibindo a lista — decisão de interface, não de acesso a dados.
 */
@Injectable({ providedIn: 'root' })
export class ImpactoService extends BaseApi<ValorSocialLocal> {
  constructor() {
    super('/api/impacto');
  }

  /** Litros reais e valor social acumulados por local, no período completo. */
  porLocal(): Observable<ValorSocialLocal[]> {
    return this.buscar<ValorSocialLocal[]>(this.url('/valor-social/por-local'));
  }
}
