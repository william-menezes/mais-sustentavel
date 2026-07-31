import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LocalForm } from './local-form.component';
import { LocalService } from '../../apis/local.api';
import { Local, LocalRequest, TipoLocal, Uf } from '../../interfaces/local.interface';

/** Superfície interna que o teste manipula — os signals são protegidos no componente. */
interface Interno {
  nome: WritableSignal<string>;
  tipo: WritableSignal<TipoLocal | null>;
  cepMascarado: WritableSignal<string>;
  rua: WritableSignal<string>;
  numero: WritableSignal<string>;
  complemento: WritableSignal<string>;
  bairro: WritableSignal<string>;
  cidade: WritableSignal<string>;
  uf: WritableSignal<Uf | null>;
  cep: () => string;
  salvarDesabilitado: () => boolean;
  titulo: () => string;
  erro: () => string | null;
  visivel: () => boolean;
  salvo: { subscribe: (fn: (local: Local) => void) => void };
  salvar: () => void;
}

const EXISTENTE: Local = {
  id: '9',
  nome: 'Antigo',
  tipo: 'ESCOLA',
  cep: '38408100',
  rua: 'Avenida João Naves de Ávila',
  numero: '1841',
  complemento: null,
  bairro: 'Saraiva',
  cidade: 'Uberlândia',
  uf: 'MG',
  arquivado: false,
  criadoEm: '',
};

/** Local vindo do modelo antigo: só o texto livre foi migrado para `rua`. */
const MIGRADO: Local = {
  ...EXISTENTE,
  id: '10',
  nome: 'Migrado',
  cep: null,
  rua: 'Rua das Flores, 100 - Centro',
  numero: null,
  bairro: null,
  cidade: null,
  uf: null,
};

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

  function abrir(local: Local | null = null): { fixture: ComponentFixture<LocalForm>; comp: Interno } {
    const fixture = TestBed.createComponent(LocalForm);
    if (local) {
      fixture.componentRef.setInput('local', local);
    }
    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  function preencher(comp: Interno): void {
    comp.nome.set('Escola A');
    comp.tipo.set('ESCOLA');
    comp.cepMascarado.set('38408-100');
    comp.rua.set('Avenida João Naves de Ávila');
    comp.numero.set('1841');
    comp.bairro.set('Saraiva');
    comp.cidade.set('Uberlândia');
    comp.uf.set('MG');
  }

  it('mantém salvar indisponível com o formulário vazio', () => {
    const { comp } = abrir();

    expect(comp.salvarDesabilitado()).toBe(true);
  });

  it('libera salvar com os obrigatórios preenchidos, sem complemento', () => {
    const { comp } = abrir();
    preencher(comp);

    expect(comp.salvarDesabilitado()).toBe(false);
  });

  it.each([
    ['nome', (c: Interno) => c.nome.set('   ')],
    ['tipo', (c: Interno) => c.tipo.set(null)],
    ['cep', (c: Interno) => c.cepMascarado.set('384')],
    ['rua', (c: Interno) => c.rua.set('')],
    ['numero', (c: Interno) => c.numero.set('  ')],
    ['bairro', (c: Interno) => c.bairro.set('')],
    ['cidade', (c: Interno) => c.cidade.set('')],
    ['uf', (c: Interno) => c.uf.set(null)],
  ])('mantém salvar indisponível quando falta %s', (_campo, esvaziar) => {
    const { comp } = abrir();
    preencher(comp);
    esvaziar(comp);

    expect(comp.salvarDesabilitado()).toBe(true);
  });

  it('deriva o CEP de oito dígitos do valor com máscara', () => {
    const { comp } = abrir();
    comp.cepMascarado.set('38408-100');

    expect(comp.cep()).toBe('38408100');
  });

  it('cadastra enviando os componentes, CEP sem máscara e complemento nulo', () => {
    const { comp } = abrir();
    servicoFake.criar.mockReturnValue(of(EXISTENTE));
    let emitido: Local | undefined;
    comp.salvo.subscribe((local) => (emitido = local));

    preencher(comp);
    comp.salvar();

    const esperado: LocalRequest = {
      nome: 'Escola A',
      tipo: 'ESCOLA',
      cep: '38408100',
      rua: 'Avenida João Naves de Ávila',
      numero: '1841',
      complemento: null,
      bairro: 'Saraiva',
      cidade: 'Uberlândia',
      uf: 'MG',
    };
    expect(servicoFake.criar).toHaveBeenCalledWith(esperado);
    expect(emitido).toEqual(EXISTENTE);
    expect(comp.visivel()).toBe(false);
  });

  it('envia o complemento quando informado', () => {
    const { comp } = abrir();
    servicoFake.criar.mockReturnValue(of(EXISTENTE));

    preencher(comp);
    comp.complemento.set('  Bloco B, sala 2  ');
    comp.salvar();

    expect(servicoFake.criar).toHaveBeenCalledWith(
      expect.objectContaining({ complemento: 'Bloco B, sala 2' }),
    );
  });

  it('não chama o serviço quando salvar está indisponível', () => {
    const { comp } = abrir();

    comp.salvar();

    expect(servicoFake.criar).not.toHaveBeenCalled();
  });

  it('pré-preenche cada componente ao editar', () => {
    const { comp } = abrir(EXISTENTE);

    expect(comp.titulo()).toBe('Editar local');
    expect(comp.nome()).toBe('Antigo');
    expect(comp.cepMascarado()).toBe('38408100');
    expect(comp.cep()).toBe('38408100');
    expect(comp.rua()).toBe('Avenida João Naves de Ávila');
    expect(comp.numero()).toBe('1841');
    expect(comp.bairro()).toBe('Saraiva');
    expect(comp.cidade()).toBe('Uberlândia');
    expect(comp.uf()).toBe('MG');
    expect(comp.salvarDesabilitado()).toBe(false);
  });

  it('edita alterando só o número, preservando os demais componentes', () => {
    const { comp } = abrir(EXISTENTE);
    servicoFake.editar.mockReturnValue(of({ ...EXISTENTE, numero: '999' }));

    comp.numero.set('999');
    comp.salvar();

    expect(servicoFake.editar).toHaveBeenCalledWith(
      '9',
      expect.objectContaining({
        numero: '999',
        rua: 'Avenida João Naves de Ávila',
        bairro: 'Saraiva',
        cidade: 'Uberlândia',
        uf: 'MG',
      }),
    );
  });

  it('local migrado abre com o texto antigo na rua e salvar indisponível', () => {
    // O endereço legado foi para `rua`; os demais componentes vêm nulos e precisam ser completados
    // antes de salvar.
    const { comp } = abrir(MIGRADO);

    expect(comp.rua()).toBe('Rua das Flores, 100 - Centro');
    expect(comp.cepMascarado()).toBe('');
    expect(comp.salvarDesabilitado()).toBe(true);
  });

  it('avisa quando o salvamento falha e mantém o painel aberto', () => {
    const { comp } = abrir();
    servicoFake.criar.mockReturnValue(throwError(() => new Error('falhou')));

    preencher(comp);
    comp.salvar();

    expect(comp.erro()).toBeTruthy();
    expect(comp.visivel()).toBe(true);
  });
});
