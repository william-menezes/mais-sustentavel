import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';

import { CepService, ResultadoCep } from './cep.api';

const URL = 'https://viacep.com.br/ws/38408100/json/';

/** Resposta real do ViaCEP para 38408-100, conferida por requisição em 31/07/2026. */
const RESPOSTA_OK = {
  cep: '38408-100',
  logradouro: 'Avenida João Naves de Ávila',
  complemento: 'de 1260 a 3630 - lado par',
  bairro: 'Saraiva',
  localidade: 'Uberlândia',
  uf: 'MG',
};

describe('CepService', () => {
  let service: CepService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CepService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // ignoreCancelled: o caso de timeout cancela a requisição ao desinscrever.
    httpMock.verify({ ignoreCancelled: true });
    vi.useRealTimers();
  });

  it('mapeia o endereço quando o CEP existe', () => {
    let resultado: ResultadoCep | undefined;
    service.consultar('38408100').subscribe((r) => (resultado = r));

    httpMock.expectOne(URL).flush(RESPOSTA_OK);

    expect(resultado).toEqual({
      situacao: 'encontrado',
      rua: 'Avenida João Naves de Ávila',
      bairro: 'Saraiva',
      cidade: 'Uberlândia',
      uf: 'MG',
    });
  });

  it('ignora o complemento devolvido pelo provedor', () => {
    // O ViaCEP usa `complemento` para faixa de numeração ("de 1260 a 3630 - lado par"), que não é
    // complemento de imóvel — aproveitá-lo poluiria o cadastro.
    let resultado: ResultadoCep | undefined;
    service.consultar('38408100').subscribe((r) => (resultado = r));

    httpMock.expectOne(URL).flush(RESPOSTA_OK);

    expect(JSON.stringify(resultado)).not.toContain('lado par');
  });

  it('não envia credenciais de sessão ao serviço externo', () => {
    service.consultar('38408100').subscribe();

    const req = httpMock.expectOne(URL);
    expect(req.request.withCredentials).toBe(false);
    req.flush(RESPOSTA_OK);
  });

  it('trata 200 com corpo de erro como não encontrado', () => {
    // O ViaCEP responde 200 (não 404) e sinaliza no corpo. E `erro` vem como a string "true".
    let resultado: ResultadoCep | undefined;
    service.consultar('38408100').subscribe((r) => (resultado = r));

    httpMock.expectOne(URL).flush({ erro: 'true' });

    expect(resultado).toEqual({ situacao: 'nao-encontrado' });
  });

  it('trata erro booleano como não encontrado', () => {
    // Defensivo: o provedor já mudou o tipo desse campo antes; tratar como truthy cobre os dois.
    let resultado: ResultadoCep | undefined;
    service.consultar('38408100').subscribe((r) => (resultado = r));

    httpMock.expectOne(URL).flush({ erro: true });

    expect(resultado).toEqual({ situacao: 'nao-encontrado' });
  });

  it('trata falha de rede como indisponível', () => {
    let resultado: ResultadoCep | undefined;
    service.consultar('38408100').subscribe((r) => (resultado = r));

    httpMock.expectOne(URL).error(new ProgressEvent('erro de rede'));

    expect(resultado).toEqual({ situacao: 'indisponivel' });
  });

  it('trata demora acima do limite como indisponível', () => {
    vi.useFakeTimers();
    let resultado: ResultadoCep | undefined;
    service.consultar('38408100').subscribe((r) => (resultado = r));
    httpMock.expectOne(URL); // nunca responde

    vi.advanceTimersByTime(CepService.LIMITE_MS + 1);

    expect(resultado).toEqual({ situacao: 'indisponivel' });
  });
});
