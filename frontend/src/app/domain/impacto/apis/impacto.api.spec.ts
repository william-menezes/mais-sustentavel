import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ImpactoService } from './impacto.api';
import { ValorSocialLocal } from '../interfaces/impacto.interface';

describe('ImpactoService', () => {
  let service: ImpactoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ImpactoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta o agregado por local com a sessão', () => {
    service.porLocal().subscribe();

    const req = httpMock.expectOne('/api/impacto/valor-social/por-local');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('devolve os litros por local', () => {
    let recebido: ValorSocialLocal[] | undefined;
    service.porLocal().subscribe((dados) => (recebido = dados));

    httpMock.expectOne('/api/impacto/valor-social/por-local').flush([
      { localId: '1', localNome: 'Escola A', litrosReais: 1610, valorSocial: 1610 },
    ]);

    expect(recebido?.[0].litrosReais).toBe(1610);
    expect(recebido?.[0].localId).toBe('1');
  });

  it('propaga a falha para quem chama decidir a degradação', () => {
    // O serviço não engole erro: a página decide exibir "—" e seguir renderizando a lista.
    let falhou = false;
    service.porLocal().subscribe({ error: () => (falhou = true) });

    httpMock
      .expectOne('/api/impacto/valor-social/por-local')
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(falhou).toBe(true);
  });
});
