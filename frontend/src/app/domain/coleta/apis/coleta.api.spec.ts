import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ColetaService } from './coleta.api';

describe('ColetaService', () => {
  let service: ColetaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ColetaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista coletas e total de um ponto', () => {
    service.listar('P1').subscribe();
    const req = httpMock.expectOne('/api/pontos/P1/coletas');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ totalLitros: 0, coletas: [] });
  });

  it('registra uma coleta (POST litrosReais + data)', () => {
    service.registrar('P1', { litrosReais: 12.5, data: '2026-07-20' }).subscribe();
    const req = httpMock.expectOne('/api/pontos/P1/coletas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ litrosReais: 12.5, data: '2026-07-20' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
