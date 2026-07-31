import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Parâmetros de query aceitos nas leituras. */
type Parametros = Record<string, string | number | boolean>;

/**
 * Base das APIs de domínio. Centraliza a URL do recurso e o `withCredentials`
 * exigido pela sessão por cookie — antes repetido em toda chamada. As escritas
 * dependem do token CSRF, que o HttpClient anexa sozinho (cookie XSRF-TOKEN →
 * header X-XSRF-TOKEN). Em dev, o proxy encaminha /api ao backend.
 *
 * As subclasses expõem os verbos do domínio em pt-BR e montam os caminhos com
 * {@link url}; recursos aninhados sob outro pai (ex.: pontos de um local) passam
 * a URL completa para os helpers.
 *
 * @typeParam T tipo devolvido pelo recurso, usado como retorno padrão dos helpers.
 */
export abstract class BaseApi<T> {
  private readonly http = inject(HttpClient);

  /** @param recurso caminho base do recurso (ex.: `/api/locais`). */
  protected constructor(protected readonly recurso: string) {}

  /** URL do recurso; com `caminho`, concatena (ex.: `/abc/arquivar`). */
  protected url(caminho = ''): string {
    return `${this.recurso}${caminho}`;
  }

  protected buscar<R = T>(url: string, params?: Parametros): Observable<R> {
    return this.http.get<R>(url, { params, withCredentials: true });
  }

  /** POST. Sem `corpo`, envia `{}` — o padrão das ações sem payload. */
  protected enviar<R = T>(url: string, corpo: unknown = {}): Observable<R> {
    return this.http.post<R>(url, corpo, { withCredentials: true });
  }

  protected substituir<R = T>(url: string, corpo: unknown): Observable<R> {
    return this.http.put<R>(url, corpo, { withCredentials: true });
  }
}
