import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LocalForm } from './local-form.component';
import { LocalService } from '../../apis/local.api';
import { Local } from '../../interfaces/local.interface';

describe('LocalForm', () => {
  let servicoFake: { criar: ReturnType<typeof vi.fn>; editar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    servicoFake = { criar: vi.fn(), editar: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [LocalForm],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: LocalService, useValue: servicoFake },
      ],
    }).compileComponents();
  });

  it('cadastra (POST) e emite salvo quando os dados são válidos', () => {
    const fixture = TestBed.createComponent(LocalForm);
    const comp = fixture.componentInstance as unknown as {
      nome: { set: (v: string) => void };
      endereco: { set: (v: string) => void };
      tipo: { set: (v: string) => void };
      visivel: () => boolean;
      salvo: { subscribe: (fn: (l: Local) => void) => void };
      salvar: () => void;
    };
    const criado: Local = { id: '1', nome: 'Escola A', tipo: 'ESCOLA', endereco: 'Rua X', arquivado: false, criadoEm: '' };
    servicoFake.criar.mockReturnValue(of(criado));
    let emitido: Local | undefined;
    comp.salvo.subscribe((l) => (emitido = l));

    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
    comp.nome.set('Escola A');
    comp.endereco.set('Rua X');
    comp.tipo.set('ESCOLA');
    comp.salvar();

    expect(servicoFake.criar).toHaveBeenCalledWith({ nome: 'Escola A', endereco: 'Rua X', tipo: 'ESCOLA' });
    expect(emitido).toEqual(criado);
    expect(comp.visivel()).toBe(false);
  });

  it('valida campos obrigatórios sem chamar o serviço', () => {
    const fixture = TestBed.createComponent(LocalForm);
    const comp = fixture.componentInstance as unknown as {
      nome: { set: (v: string) => void };
      erro: () => string | null;
      salvar: () => void;
    };
    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
    comp.nome.set('   ');
    comp.salvar();

    expect(servicoFake.criar).not.toHaveBeenCalled();
    expect(comp.erro()).toBeTruthy();
  });

  it('edita (PUT) quando recebe um local', () => {
    const fixture = TestBed.createComponent(LocalForm);
    const comp = fixture.componentInstance as unknown as {
      nome: { set: (v: string) => void };
      salvar: () => void;
    };
    const alvo: Local = { id: '9', nome: 'Antigo', tipo: 'ESCOLA', endereco: 'Rua Y', arquivado: false, criadoEm: '' };
    servicoFake.editar.mockReturnValue(of({ ...alvo, nome: 'Novo' }));
    fixture.componentRef.setInput('local', alvo);
    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
    comp.nome.set('Novo');
    comp.salvar();

    expect(servicoFake.editar).toHaveBeenCalledWith('9', { nome: 'Novo', endereco: 'Rua Y', tipo: 'ESCOLA' });
  });
});
