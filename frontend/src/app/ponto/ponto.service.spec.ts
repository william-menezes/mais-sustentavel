import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PontoService } from './ponto.service';

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

  it('cadastra ponto no local (POST corpo vazio)', () => {
    service.criar('L1').subscribe();
    const req = httpMock.expectOne('/api/locais/L1/pontos');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
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
