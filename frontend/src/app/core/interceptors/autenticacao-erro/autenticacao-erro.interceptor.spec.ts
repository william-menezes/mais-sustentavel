import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { autenticacaoErroInterceptor } from './autenticacao-erro.interceptor';

describe('autenticacaoErroInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let navegou: string | null;

  beforeEach(() => {
    navegou = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([autenticacaoErroInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigateByUrl: (url: string) => (navegou = url) } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('redireciona ao login quando um endpoint protegido responde 401', () => {
    http.get('/api/locais').subscribe({ error: () => {} });
    httpMock.expectOne('/api/locais').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(navegou).toBe('/login');
  });

  it('não redireciona quando o 401 vem de um endpoint de autenticação', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(navegou).toBeNull();
  });
});
