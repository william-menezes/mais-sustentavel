import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';

import { UFS } from '../constants/uf.constant';
import { Uf } from '../interfaces/local.interface';

/** Campos do ViaCEP que aproveitamos, mais o sinalizador de erro. */
interface RespostaViaCep {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  /** Presente e "verdadeiro" quando o CEP não existe. O provedor devolve a string "true". */
  erro?: string | boolean;
}

/**
 * Resultado da consulta como união discriminada: os três desfechos possíveis não podem ser
 * confundidos por quem chama, e nenhum deles é exceção — a indisponibilidade é um resultado
 * esperado (FR-013), não um erro a tratar.
 */
export type ResultadoCep =
  | { situacao: 'encontrado'; rua: string; bairro: string; cidade: string; uf: Uf | null }
  | { situacao: 'nao-encontrado' }
  | { situacao: 'indisponivel' };

/**
 * Consulta de CEP no ViaCEP, direto do navegador.
 *
 * <p>Não estende {@link BaseApi} de propósito: aquela classe injeta `withCredentials` e monta URLs
 * sob `/api`. Aqui o destino é um terceiro, e o cookie de sessão e o token CSRF **não** podem
 * viajar para fora (Art. 7.4).
 *
 * <p>O `autenticacaoErroInterceptor` observa esta resposta como qualquer outra, mas só reage a 401
 * — status que o ViaCEP não emite.
 */
@Injectable({ providedIn: 'root' })
export class CepService {
  /** Acima disso a consulta é considerada indisponível e o cadastro segue manualmente. */
  static readonly LIMITE_MS = 5000;

  private static readonly BASE = 'https://viacep.com.br/ws';

  private readonly http = inject(HttpClient);

  /** @param cep oito dígitos, sem formatação. */
  consultar(cep: string): Observable<ResultadoCep> {
    return this.http.get<RespostaViaCep>(`${CepService.BASE}/${cep}/json/`).pipe(
      timeout(CepService.LIMITE_MS),
      map((resposta): ResultadoCep => {
        // CEP inexistente responde 200 com o sinalizador no corpo, não 404 — verificado no
        // provedor. Tratado como truthy para não depender de o campo ser string ou booleano.
        if (resposta.erro) {
          return { situacao: 'nao-encontrado' };
        }
        return {
          situacao: 'encontrado',
          rua: resposta.logradouro ?? '',
          bairro: resposta.bairro ?? '',
          cidade: resposta.localidade ?? '',
          uf: this.ufValida(resposta.uf),
        };
      }),
      // Rede fora, timeout ou corpo inesperado: degrada sem propagar exceção.
      catchError(() => of<ResultadoCep>({ situacao: 'indisponivel' })),
    );
  }

  /** Só aceita sigla da lista fechada; qualquer outra coisa vira nulo em vez de sujar o cadastro. */
  private ufValida(uf: string | undefined): Uf | null {
    return uf && UFS.includes(uf as Uf) ? (uf as Uf) : null;
  }
}
