import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LocalService } from './local.api';
import { LocalRequest } from '../interfaces/local.interface';

describe('LocalService', () => {
  let service: LocalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista ativos por padrão (arquivados=false)', () => {
    service.listar().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/locais');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('arquivados')).toBe('false');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('lista arquivados quando pedido', () => {
    service.listar(true).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/locais');
    expect(req.request.params.get('arquivados')).toBe('true');
    req.flush([]);
  });

  it('cadastra via POST /api/locais', () => {
    const corpo: LocalRequest = { nome: 'Escola A', endereco: 'Rua X, 1', tipo: 'ESCOLA' };
    service.criar(corpo).subscribe();
    const req = httpMock.expectOne('/api/locais');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(corpo);
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('edita via PUT /api/locais/{id}', () => {
    const corpo: LocalRequest = { nome: 'Novo', endereco: 'Rua Y, 2', tipo: 'EMPRESA' };
    service.editar('abc', corpo).subscribe();
    const req = httpMock.expectOne('/api/locais/abc');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(corpo);
    req.flush({});
  });

  it('arquiva via POST /api/locais/{id}/arquivar', () => {
    service.arquivar('abc').subscribe();
    const req = httpMock.expectOne('/api/locais/abc/arquivar');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('reativa via POST /api/locais/{id}/reativar', () => {
    service.reativar('abc').subscribe();
    const req = httpMock.expectOne('/api/locais/abc/reativar');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
