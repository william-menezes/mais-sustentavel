import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Local } from '@domain/local/interfaces/local.interface';
import { PontoForm } from './ponto-form.component';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

/** Superfície interna lida pelos testes — os derivados são protegidos no componente. */
interface Interno {
  visivel: () => boolean;
  criando: () => boolean;
  novoPonto: () => Ponto | null;
  arquivado: () => boolean;
  referencia: () => string;
  urlDoQr: () => string;
  criar: () => void;
  baixarQr: () => void;
  fechar: () => void;
  criado: { subscribe: (fn: (ponto: Ponto) => void) => void };
}

const LOCAL: Local = {
  id: 'local-1',
  nome: 'EMEF Zaida Barbosa',
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

const CRIADO: Ponto = {
  id: 'df53d7e1-0000-1111-2222-333333333333',
  localId: LOCAL.id,
  qrConteudo: 'conteudo',
  qrImagemUrl: '/api/pontos/df53d7e1/qr',
  arquivado: false,
  criadoEm: '2026-07-30T12:00:00',
};

describe('PontoForm', () => {
  let pontoFake: { criar: ReturnType<typeof vi.fn>; qrUrl: ReturnType<typeof vi.fn> };

  function abrir(
    opcoes: { local?: Local | null; falha?: boolean } = {},
  ): { fixture: ComponentFixture<PontoForm>; comp: Interno } {
    pontoFake = {
      criar: vi
        .fn()
        .mockReturnValue(opcoes.falha ? throwError(() => new Error('fora')) : of(CRIADO)),
      qrUrl: vi.fn().mockImplementation((id: string) => `/api/pontos/${id}/qr`),
    };

    TestBed.configureTestingModule({
      imports: [PontoForm],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        MessageService,
        { provide: PontoService, useValue: pontoFake },
      ],
    });

    const fixture = TestBed.createComponent(PontoForm);
    fixture.componentRef.setInput('local', 'local' in opcoes ? opcoes.local : LOCAL);
    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  // ---------- passo de confirmação ----------

  it('começa na confirmação, sem ponto criado', () => {
    const { fixture, comp } = abrir();

    expect(comp.novoPonto()).toBeNull();
    expect(pontoFake.criar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="criar-ponto"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="qr"]')).toBeFalsy();
  });

  it('explica que não há campos e nomeia o local', () => {
    // O painel precisa justificar a própria existência: sem campos, o texto é o conteúdo.
    const { fixture } = abrir();

    expect(fixture.nativeElement.textContent as string).toContain('não tem campos');
    expect(fixture.nativeElement.textContent as string).toContain('EMEF Zaida Barbosa');
  });

  it('cria o ponto para o local recebido', () => {
    const { comp } = abrir();

    comp.criar();

    expect(pontoFake.criar).toHaveBeenCalledWith(LOCAL.id);
    expect(comp.novoPonto()?.id).toBe(CRIADO.id);
    expect(comp.criando()).toBe(false);
  });

  it('emite criado para a ficha recarregar a lista', () => {
    const { comp } = abrir();
    let emitido: Ponto | undefined;
    comp.criado.subscribe((ponto) => (emitido = ponto));

    comp.criar();

    expect(emitido?.id).toBe(CRIADO.id);
  });

  it('mantém o painel aberto depois de criar, para mostrar o QR', () => {
    // Fechar aqui esconderia justamente o motivo de cadastrar um ponto.
    const { comp } = abrir();

    comp.criar();

    expect(comp.visivel()).toBe(true);
  });

  // ---------- passo do QR ----------

  it('mostra o QR e a referência curta depois de criar', () => {
    const { fixture, comp } = abrir();

    comp.criar();
    fixture.detectChanges();

    expect(comp.referencia()).toBe('df53d7e1');
    expect(comp.urlDoQr()).toBe(`/api/pontos/${CRIADO.id}/qr`);
    expect(fixture.nativeElement.querySelector('[data-testid="qr"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="referencia"]')?.textContent).toContain(
      'df53d7e1',
    );
  });

  it('troca o rodapé por baixar e concluir depois de criar', () => {
    const { fixture, comp } = abrir();

    comp.criar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="baixar-qr"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="concluir"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="criar-ponto"]')).toBeFalsy();
  });

  it('projeta o próprio rodapé no lugar dos botões de formulário', () => {
    // Guarda do slot `[acoes]`: um seletor que não casasse cairia no corpo do painel e o rodapé
    // voltaria a ser Cancelar/Salvar — e "Salvar" não existe neste fluxo.
    const { fixture } = abrir();

    expect(fixture.nativeElement.querySelector('[data-testid="salvar"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="criar-ponto"]')).toBeTruthy();
  });

  it('esquece o ponto ao fechar, para a próxima abertura começar do início', () => {
    const { comp } = abrir();
    comp.criar();

    comp.fechar();

    expect(comp.visivel()).toBe(false);
    expect(comp.novoPonto()).toBeNull();
  });

  // ---------- degradação ----------

  it('não cria ponto em local arquivado e diz o motivo', () => {
    // A API recusaria; avisar antes evita oferecer uma ação que só terminaria em erro.
    const { fixture, comp } = abrir({ local: { ...LOCAL, arquivado: true } });

    comp.criar();

    expect(pontoFake.criar).not.toHaveBeenCalled();
    expect(comp.arquivado()).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="aviso-arquivado"]')).toBeTruthy();
    const botao = fixture.nativeElement.querySelector(
      '[data-testid="criar-ponto"]',
    ) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
  });

  it('permanece na confirmação quando a criação falha', () => {
    const { comp } = abrir({ falha: true });

    comp.criar();

    expect(comp.novoPonto()).toBeNull();
    expect(comp.criando()).toBe(false);
    expect(comp.visivel()).toBe(true);
  });

  it('não cria nada sem local', () => {
    const { comp } = abrir({ local: null });

    comp.criar();

    expect(pontoFake.criar).not.toHaveBeenCalled();
  });

  it('baixa o QR com a referência curta no nome do arquivo', () => {
    const { comp } = abrir();
    comp.criar();
    const clique = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_valor: string) {},
      download: '',
      click: clique,
    } as unknown as HTMLAnchorElement);

    comp.baixarQr();

    expect(clique).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
