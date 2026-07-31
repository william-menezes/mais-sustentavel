import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { Login } from './login.page';

describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
      ],
    }).compileComponents();
  });

  it('cria a tela de login', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exibe mensagem genérica quando o login falha (401)', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const httpMock = TestBed.inject(HttpTestingController);
    const comp = fixture.componentInstance as unknown as {
      email: { set: (v: string) => void };
      senha: { set: (v: string) => void };
      erro: () => string | null;
      entrar: () => void;
    };

    comp.email.set('gestor@teste.com');
    comp.senha.set('errada');
    comp.entrar();

    httpMock
      .expectOne('/api/auth/login')
      .flush({ erro: 'Credenciais inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(comp.erro()).toBe('Credenciais inválidas');
    httpMock.verify();
  });
});
