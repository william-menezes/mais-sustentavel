import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PontoService } from './ponto.api';

describe('PontoService', () => {
  let service: PontoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PontoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lista pontos ativos de um local', () => {
    service.listar('L1').subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/locais/L1/pontos');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('arquivados')).toBe('false');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('lista estações de todos os locais numa chamada só', () => {
    // A coleção global é o que a visão geral consome; não existia antes da 007.
    service.listarTodos().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/pontos');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('arquivados')).toBe('false');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('lista as arquivadas quando pedido', () => {
    service.listarTodos(true).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/pontos');
    expect(req.request.params.get('arquivados')).toBe('true');
    req.flush([]);
  });

  it('cadastra a estação enviando a referência no corpo', () => {
    // Mudança incompatível da 007: antes o POST não tinha corpo. A referência é obrigatória em
    // cadastros novos, e a obrigatoriedade é garantida no servidor (FR-018).
    service.criar('L1', { referencia: 'pátio' }).subscribe();
    const req = httpMock.expectOne('/api/locais/L1/pontos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ referencia: 'pátio' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('edita a referência sem enviar o local', () => {
    // Trocar a estação de local reescreveria o histórico de coletas de dois locais, inclusive o
    // valor social já publicado (RN-G-05) — o corpo não tem por onde pedir isso.
    service.editar('P1', { referencia: 'pátio coberto' }).subscribe();
    const req = httpMock.expectOne('/api/pontos/P1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ referencia: 'pátio coberto' });
    req.flush({});
  });

  it('arquiva e reativa via /api/pontos/{id}', () => {
    service.arquivar('P1').subscribe();
    httpMock.expectOne('/api/pontos/P1/arquivar').flush({});
    service.reativar('P1').subscribe();
    httpMock.expectOne('/api/pontos/P1/reativar').flush({});
  });

  it('monta a URL do QR', () => {
    expect(service.qrUrl('P9')).toBe('/api/pontos/P9/qr');
  });
});
