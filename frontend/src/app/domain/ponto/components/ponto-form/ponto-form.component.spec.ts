import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { MenuItem, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CepService } from '@domain/local/apis/cep.api';
import { LocalService } from '@domain/local/apis/local.api';
import { LocalAutocomplete } from '@domain/local/components/local-autocomplete/local-autocomplete.component';
import { LocalForm } from '@domain/local/components/local-form/local-form.component';
import { Local, TipoLocal, Uf } from '@domain/local/interfaces/local.interface';
import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';
import { PontoForm } from './ponto-form.component';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

/** Superfície interna lida pelos testes — os derivados são protegidos no componente. */
interface Interno {
  visivel: { (): boolean; set: (valor: boolean) => void };
  enviando: () => boolean;
  novoPonto: () => Ponto | null;
  arquivado: () => boolean;
  localFixo: () => boolean;
  localEscolhido: { (): Local | null; set: (valor: Local | null) => void };
  referencia: { (): string; set: (valor: string) => void };
  refCurta: () => string;
  pendencia: () => string;
  concluirDesabilitado: () => boolean;
  urlDoQr: () => string;
  edicao: () => boolean;
  titulo: () => string;
  trilha: () => MenuItem[];
  nomeDoLocal: () => string;
  concluir: () => void;
  criar: () => void;
  baixarQr: () => void;
  fechar: () => void;
  criado: { subscribe: (fn: (ponto: Ponto) => void) => void };
  editado: { subscribe: (fn: (ponto: Ponto) => void) => void };
}

/** Superfície do formulário de Local empilhado, que o teste preenche para concluir o cadastro. */
interface FormularioDeLocal {
  nome: { set: (valor: string) => void };
  tipo: { set: (valor: TipoLocal | null) => void };
  cepMascarado: { set: (valor: string) => void };
  rua: { set: (valor: string) => void };
  numero: { set: (valor: string) => void };
  bairro: { set: (valor: string) => void };
  cidade: { set: (valor: string) => void };
  uf: { set: (valor: Uf | null) => void };
  salvar: () => void;
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

const OUTRO_LOCAL: Local = {
  ...LOCAL,
  id: 'local-2',
  nome: 'Condomínio Jardim das Acácias',
  tipo: 'CONDOMINIO',
  bairro: 'Santa Mônica',
};

/** Local cadastrado pelo caminho empilhado, no meio do cadastro da estação. */
const LOCAL_NOVO: Local = {
  ...LOCAL,
  id: 'local-9',
  nome: 'Condomínio Recém-Conquistado',
  tipo: 'CONDOMINIO',
  bairro: 'Tibery',
};

const CRIADO: Ponto = {
  id: 'df53d7e1-0000-1111-2222-333333333333',
  localId: LOCAL.id,
  localNome: LOCAL.nome,
  referencia: 'portaria',
  qrConteudo: 'https://sustentavel.app/p/df53d7e1-0000-1111-2222-333333333333',
  qrImagemUrl: '/api/pontos/df53d7e1/qr',
  arquivado: false,
  criadoEm: '2026-07-30T12:00:00',
};

/** Estação já cadastrada, com a referência escrita errado — é ela que o Gestor vem corrigir. */
const EXISTENTE: Ponto = {
  ...CRIADO,
  id: 'ab12cd34-0000-1111-2222-444444444444',
  referencia: 'portara',
};

/** O que a API devolve depois do PUT. */
const CORRIGIDO: Ponto = { ...EXISTENTE, referencia: 'portaria' };

describe('PontoForm', () => {
  let pontoFake: {
    criar: ReturnType<typeof vi.fn>;
    editar: ReturnType<typeof vi.fn>;
    qrUrl: ReturnType<typeof vi.fn>;
  };
  let localFake: {
    listar: ReturnType<typeof vi.fn>;
    criar: ReturnType<typeof vi.fn>;
    editar: ReturnType<typeof vi.fn>;
  };
  let cepFake: { consultar: ReturnType<typeof vi.fn> };

  function abrir(
    opcoes: {
      local?: Local | null;
      /** Estação em correção: com ela o painel abre em modo de edição (FR-039). */
      estacao?: Ponto | null;
      nivel?: number;
      falha?: boolean;
    } = {},
  ): {
    fixture: ComponentFixture<PontoForm>;
    comp: Interno;
  } {
    pontoFake = {
      criar: vi
        .fn()
        .mockReturnValue(opcoes.falha ? throwError(() => new Error('fora')) : of(CRIADO)),
      editar: vi
        .fn()
        .mockReturnValue(opcoes.falha ? throwError(() => new Error('fora')) : of(CORRIGIDO)),
      qrUrl: vi.fn().mockImplementation((id: string) => `/api/pontos/${id}/qr`),
    };
    // O campo de busca de local é filho deste painel; o formulário de Local, filho do campo.
    localFake = {
      listar: vi.fn().mockReturnValue(of([LOCAL, OUTRO_LOCAL])),
      criar: vi.fn().mockReturnValue(of(LOCAL_NOVO)),
      editar: vi.fn(),
    };
    cepFake = { consultar: vi.fn().mockReturnValue(of({ situacao: 'nao-encontrado' })) };

    TestBed.configureTestingModule({
      imports: [PontoForm],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        MessageService,
        { provide: PontoService, useValue: pontoFake },
        { provide: LocalService, useValue: localFake },
        { provide: CepService, useValue: cepFake },
      ],
    });

    const fixture = TestBed.createComponent(PontoForm);
    fixture.componentRef.setInput('local', 'local' in opcoes ? opcoes.local : null);
    fixture.componentRef.setInput('estacao', opcoes.estacao ?? null);
    if (opcoes.nivel !== undefined) {
      fixture.componentRef.setInput('nivel', opcoes.nivel);
    }
    fixture.componentRef.setInput('visivel', true);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  /** Preenche o cadastro como o Gestor faria: escolhe o local e nomeia a estação. */
  function preencher(comp: Interno, referencia = 'portaria'): void {
    comp.localEscolhido.set(LOCAL);
    comp.referencia.set(referencia);
  }

  function avisoDePendencia(fixture: ComponentFixture<PontoForm>): string {
    return fixture.nativeElement.querySelector('[data-testid="pendencia"]')?.textContent ?? '';
  }

  /** Ação principal do rodapé no passo de preenchimento — cadastra ou salva a correção. */
  function botaoPrincipal(fixture: ComponentFixture<PontoForm>): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      '[data-testid="concluir-ponto"]',
    ) as HTMLButtonElement;
  }

  function campoDeReferencia(fixture: ComponentFixture<PontoForm>): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      '[data-testid="campo-referencia"]',
    ) as HTMLInputElement;
  }

  function campoDeLocal(fixture: ComponentFixture<PontoForm>): {
    abrirNovoLocal: () => void;
  } {
    const encontrado = fixture.debugElement.query(By.directive(LocalAutocomplete));
    return encontrado.componentInstance as unknown as { abrirNovoLocal: () => void };
  }

  function formularioDeLocal(fixture: ComponentFixture<PontoForm>): FormularioDeLocal {
    const encontrado = fixture.debugElement.query(By.directive(LocalForm));
    return encontrado.componentInstance as unknown as FormularioDeLocal;
  }

  function preencherLocalNovo(form: FormularioDeLocal): void {
    form.nome.set('Condomínio Recém-Conquistado');
    form.tipo.set('CONDOMINIO');
    form.cepMascarado.set('38408-100');
    form.rua.set('Rua Nova');
    form.numero.set('10');
    form.bairro.set('Tibery');
    form.cidade.set('Uberlândia');
    form.uf.set('MG');
  }

  function painelDeCima(fixture: ComponentFixture<PontoForm>): number {
    return fixture.debugElement.query(By.directive(FormDrawer)).componentInstance.nivel() as number;
  }

  // ---------- o que o painel explica ----------

  it('começa na confirmação, sem ponto criado', () => {
    const { fixture, comp } = abrir();

    expect(comp.novoPonto()).toBeNull();
    expect(pontoFake.criar).not.toHaveBeenCalled();
    expect(botaoPrincipal(fixture)).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="qr"]')).toBeFalsy();
  });

  it('informa que o QR é gerado pelo sistema, e não é campo a preencher', () => {
    // FR-022: sem isso o Gestor procura na tela um campo de QR que não existe.
    const { fixture } = abrir();
    const aviso =
      fixture.nativeElement.querySelector('[data-testid="aviso-qr"]')?.textContent ?? '';

    expect(aviso).toContain('QR');
    expect(aviso).toContain('gerado');
  });

  it('orienta o que fazer depois de concluir', () => {
    // FR-023: o QR só serve depois de impresso e fixado no lugar da entrega.
    const { fixture } = abrir();
    const orientacao =
      fixture.nativeElement.querySelector('[data-testid="orientacao"]')?.textContent ?? '';

    expect(orientacao.toLowerCase()).toContain('imprim');
  });

  // ---------- campo de local ----------

  it('oferece a busca de local quando nenhum local foi pré-selecionado', () => {
    const { fixture, comp } = abrir();

    expect(fixture.nativeElement.querySelector('app-local-autocomplete')).toBeTruthy();
    expect(comp.localFixo()).toBe(false);
    expect(comp.localEscolhido()).toBeNull();
  });

  it('não pergunta o local quando ele já vem escolhido', () => {
    // Abertura pela ficha do Local: perguntar o que já se sabe seria trabalho inventado (FR-019).
    const { fixture, comp } = abrir({ local: LOCAL });

    expect(comp.localFixo()).toBe(true);
    expect(comp.localEscolhido()).toEqual(LOCAL);
    expect(fixture.nativeElement.querySelector('app-local-autocomplete')).toBeFalsy();
    expect(fixture.nativeElement.textContent as string).toContain('EMEF Zaida Barbosa');
  });

  it('adota o local escolhido no campo de busca', () => {
    const { fixture, comp } = abrir();
    const campo = fixture.debugElement.query(By.directive(LocalAutocomplete))
      .componentInstance as LocalAutocomplete;

    campo.local.set(OUTRO_LOCAL);
    fixture.detectChanges();

    expect(comp.localEscolhido()).toEqual(OUTRO_LOCAL);
  });

  // ---------- pendências (FR-024, FR-049, FR-050) ----------

  it('mantém concluir indisponível e diz que falta escolher o local', () => {
    const { fixture, comp } = abrir();

    expect(comp.concluirDesabilitado()).toBe(true);
    expect(comp.pendencia()).toContain('local');
    expect(avisoDePendencia(fixture)).toContain('local');
    expect(botaoPrincipal(fixture).disabled).toBe(true);
  });

  it('mantém concluir indisponível e cobra a referência depois de escolher o local', () => {
    const { fixture, comp } = abrir();

    comp.localEscolhido.set(LOCAL);
    fixture.detectChanges();

    expect(comp.concluirDesabilitado()).toBe(true);
    expect(comp.pendencia().toLowerCase()).toContain('referência');
    expect(avisoDePendencia(fixture).toLowerCase()).toContain('referência');
    expect(botaoPrincipal(fixture).disabled).toBe(true);
  });

  it('não aceita referência só de espaços como preenchida', () => {
    const { comp } = abrir();

    preencher(comp, '   ');

    expect(comp.concluirDesabilitado()).toBe(true);
    expect(comp.pendencia().toLowerCase()).toContain('referência');
  });

  it('libera concluir e apaga o aviso quando local e referência estão preenchidos', () => {
    const { fixture, comp } = abrir();

    preencher(comp);
    fixture.detectChanges();

    expect(comp.concluirDesabilitado()).toBe(false);
    expect(comp.pendencia()).toBe('');
    expect(fixture.nativeElement.querySelector('[data-testid="pendencia"]')).toBeFalsy();
    expect(botaoPrincipal(fixture).disabled).toBe(false);
  });

  it('limita a referência ao tamanho que cabe como título de cartão', () => {
    // FR-017: 60 caracteres, barrados no próprio campo em vez de recusados depois de digitar.
    const { fixture } = abrir();
    const campo = fixture.nativeElement.querySelector(
      '[data-testid="campo-referencia"]',
    ) as HTMLInputElement;

    expect(campo.getAttribute('maxlength')).toBe('60');
  });

  // ---------- cadastro ----------

  it('cria a estação com o local escolhido e a referência informada', () => {
    const { comp } = abrir();
    preencher(comp);

    comp.criar();

    expect(pontoFake.criar).toHaveBeenCalledWith(LOCAL.id, { referencia: 'portaria' });
    expect(comp.novoPonto()?.id).toBe(CRIADO.id);
    expect(comp.enviando()).toBe(false);
  });

  it('descarta os espaços em volta da referência antes de enviar', () => {
    // FR-016: "  pátio  " é a mesma estação que "pátio", e o espaço sobrando vira título torto.
    const { comp } = abrir();
    preencher(comp, '  pátio  ');

    comp.criar();

    expect(pontoFake.criar).toHaveBeenCalledWith(LOCAL.id, { referencia: 'pátio' });
  });

  it('emite criado para quem hospeda recarregar a lista', () => {
    const { comp } = abrir();
    preencher(comp);
    let emitido: Ponto | undefined;
    comp.criado.subscribe((ponto) => (emitido = ponto));

    comp.criar();

    expect(emitido?.id).toBe(CRIADO.id);
  });

  it('mantém o painel aberto depois de criar, para mostrar o QR', () => {
    // Fechar aqui esconderia justamente o motivo de cadastrar uma estação.
    const { comp } = abrir();
    preencher(comp);

    comp.criar();

    expect(comp.visivel()).toBe(true);
  });

  it('não cria nada sem local, mesmo com referência preenchida', () => {
    const { comp } = abrir();
    comp.referencia.set('portaria');

    comp.criar();

    expect(pontoFake.criar).not.toHaveBeenCalled();
  });

  it('não cria nada sem referência, mesmo com o local escolhido', () => {
    const { comp } = abrir();
    comp.localEscolhido.set(LOCAL);

    comp.criar();

    expect(pontoFake.criar).not.toHaveBeenCalled();
  });

  // ---------- passo do QR ----------

  it('mostra o QR e a referência curta depois de criar', () => {
    const { fixture, comp } = abrir();
    preencher(comp);

    comp.criar();
    fixture.detectChanges();

    expect(comp.refCurta()).toBe('df53d7e1');
    expect(comp.urlDoQr()).toBe(`/api/pontos/${CRIADO.id}/qr`);
    expect(fixture.nativeElement.querySelector('[data-testid="qr"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="referencia-curta"]')?.textContent,
    ).toContain('df53d7e1');
  });

  it('troca o rodapé por baixar e concluir depois de criar', () => {
    const { fixture, comp } = abrir();
    preencher(comp);

    comp.criar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="baixar-qr"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="concluir"]')).toBeTruthy();
    expect(botaoPrincipal(fixture)).toBeFalsy();
    // Nada mais falta: o aviso de pendências sai de cena no passo do QR.
    expect(fixture.nativeElement.querySelector('[data-testid="pendencia"]')).toBeFalsy();
  });

  it('projeta o próprio rodapé no lugar dos botões de formulário', () => {
    // Guarda do slot `[acoes]`: um seletor que não casasse cairia no corpo do painel e o rodapé
    // voltaria a ser Cancelar/Salvar — e "Salvar" não existe neste fluxo.
    const { fixture } = abrir();

    expect(fixture.nativeElement.querySelector('[data-testid="salvar"]')).toBeFalsy();
    expect(botaoPrincipal(fixture)).toBeTruthy();
  });

  it('baixa o QR com a referência curta no nome do arquivo', () => {
    const { comp } = abrir();
    preencher(comp);
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

  // ---------- desistir e recomeçar ----------

  it('esquece ponto, local e referência ao fechar, para a próxima abertura começar do início', () => {
    const { comp } = abrir();
    preencher(comp);
    comp.criar();

    comp.fechar();

    expect(comp.visivel()).toBe(false);
    expect(comp.novoPonto()).toBeNull();
    expect(comp.referencia()).toBe('');
    expect(comp.localEscolhido()).toBeNull();
  });

  it('cancelar não cria estação nenhuma', () => {
    // FR-025: desistir tem de sair sem deixar rastro.
    const { fixture, comp } = abrir();
    preencher(comp);

    (
      fixture.nativeElement.querySelector('[data-testid="cancelar-ponto"]') as HTMLButtonElement
    ).click();

    expect(pontoFake.criar).not.toHaveBeenCalled();
    expect(comp.visivel()).toBe(false);
  });

  it('volta ao local pré-selecionado a cada abertura', () => {
    const { fixture, comp } = abrir({ local: LOCAL });
    comp.referencia.set('portaria');

    comp.fechar();
    // Reabre como o hospedeiro reabre: pelo two-way de visibilidade, que acabou de voltar a false.
    comp.visivel.set(true);
    fixture.detectChanges();

    expect(comp.localEscolhido()).toEqual(LOCAL);
    expect(comp.referencia()).toBe('');
  });

  // ---------- correção da referência (FR-039) ----------

  it('cadastra pela ação principal quando nenhuma estação está em correção', () => {
    // O mesmo botão serve aos dois modos, e é ele que decide entre POST e PUT.
    const { comp } = abrir();
    preencher(comp);

    comp.concluir();

    expect(pontoFake.criar).toHaveBeenCalledWith(LOCAL.id, { referencia: 'portaria' });
    expect(pontoFake.editar).not.toHaveBeenCalled();
  });

  it('pré-carrega a referência atual no campo ao abrir para corrigir', async () => {
    const { fixture, comp } = abrir({ estacao: EXISTENTE });
    await fixture.whenStable();

    expect(comp.edicao()).toBe(true);
    expect(comp.referencia()).toBe('portara');
    expect(campoDeReferencia(fixture).value).toBe('portara');
    expect(comp.concluirDesabilitado()).toBe(false);
  });

  it('abre com o campo vazio quando a estação nunca teve referência', () => {
    // Acervo anterior à V7 (FR-012): não há o que pré-carregar, e nada é inventado no lugar.
    const { comp } = abrir({ estacao: { ...EXISTENTE, referencia: null } });

    expect(comp.referencia()).toBe('');
    expect(comp.concluirDesabilitado()).toBe(true);
    expect(comp.pendencia().toLowerCase()).toContain('referência');
  });

  it('mostra o local como dado, sem deixar trocá-lo', () => {
    // RN-G-05: a estação não muda de local. Um campo de busca aqui ofereceria o que a API recusa.
    const { fixture, comp } = abrir({ estacao: EXISTENTE });

    expect(comp.localFixo()).toBe(true);
    expect(comp.nomeDoLocal()).toBe(LOCAL.nome);
    expect(fixture.nativeElement.querySelector('app-local-autocomplete')).toBeFalsy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="local-fixo"]')?.textContent as string,
    ).toContain(LOCAL.nome);
  });

  it('nomeia a correção no título e na trilha, e não um cadastro', () => {
    const { comp } = abrir({ estacao: EXISTENTE });

    expect(comp.titulo().toLowerCase()).toContain('referência');
    expect(comp.titulo().toLowerCase()).not.toContain('novo');
    expect(comp.trilha().at(-1)?.label?.toLowerCase()).toContain('referência');
  });

  it('rotula a ação principal com o que ela faz, não com "Gerar ponto"', () => {
    const { fixture } = abrir({ estacao: EXISTENTE });
    const rotulo = botaoPrincipal(fixture).textContent ?? '';

    expect(rotulo).toContain('Salvar referência');
    expect(rotulo).not.toContain('Gerar');
  });

  it('salva a referência corrigida com editar, e nunca cria uma segunda estação', () => {
    const { comp } = abrir({ estacao: EXISTENTE });

    comp.referencia.set('portaria');
    comp.concluir();

    expect(pontoFake.editar).toHaveBeenCalledWith(EXISTENTE.id, { referencia: 'portaria' });
    expect(pontoFake.criar).not.toHaveBeenCalled();
    expect(comp.enviando()).toBe(false);
  });

  it('descarta os espaços em volta da referência corrigida', () => {
    const { comp } = abrir({ estacao: EXISTENTE });

    comp.referencia.set('  pátio  ');
    comp.concluir();

    expect(pontoFake.editar).toHaveBeenCalledWith(EXISTENTE.id, { referencia: 'pátio' });
  });

  it('não salva referência apagada', () => {
    const { comp } = abrir({ estacao: EXISTENTE });

    comp.referencia.set('   ');
    comp.concluir();

    expect(pontoFake.editar).not.toHaveBeenCalled();
    expect(comp.concluirDesabilitado()).toBe(true);
  });

  it('não abre passo de QR depois de corrigir: o adesivo colado continua valendo', () => {
    const { fixture, comp } = abrir({ estacao: EXISTENTE });
    comp.referencia.set('portaria');

    comp.concluir();
    fixture.detectChanges();

    // A correção aconteceu — sem isso as ausências abaixo passariam só porque nada foi feito.
    expect(pontoFake.editar).toHaveBeenCalled();
    expect(comp.novoPonto()).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="qr"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="baixar-qr"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="ponto-criado"]')).toBeFalsy();
  });

  it('fecha o painel depois de corrigir', () => {
    // Sem QR para mostrar, não há passo seguinte: o desfecho é fechar e avisar.
    const { comp } = abrir({ estacao: EXISTENTE });
    comp.referencia.set('portaria');

    comp.concluir();

    expect(comp.visivel()).toBe(false);
  });

  it('emite editado para quem hospeda recarregar a lista', () => {
    const { comp } = abrir({ estacao: EXISTENTE });
    comp.referencia.set('portaria');
    let emitido: Ponto | undefined;
    comp.editado.subscribe((ponto) => (emitido = ponto));

    comp.concluir();

    expect(emitido?.referencia).toBe('portaria');
  });

  it('explica que o QR não muda, em vez de prometer um novo', () => {
    // Os avisos do cadastro (QR gerado ao concluir, imprimir e fixar) seriam falsos aqui.
    const { fixture } = abrir({ estacao: EXISTENTE });
    const nota = fixture.nativeElement.querySelector('[data-testid="qr-inalterado"]')
      ?.textContent as string;

    expect(nota).toContain('QR');
    expect(fixture.nativeElement.querySelector('[data-testid="aviso-qr"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="orientacao"]')).toBeFalsy();
  });

  it('permanece aberto quando a correção falha', () => {
    const { comp } = abrir({ estacao: EXISTENTE, falha: true });
    comp.referencia.set('portaria');
    let emitido: Ponto | undefined;
    comp.editado.subscribe((ponto) => (emitido = ponto));

    comp.concluir();

    expect(comp.visivel()).toBe(true);
    expect(comp.enviando()).toBe(false);
    expect(emitido).toBeUndefined();
  });

  it('não carrega resíduo da correção anterior ao reabrir para cadastrar', () => {
    const { fixture, comp } = abrir({ estacao: EXISTENTE });
    comp.referencia.set('portaria');
    comp.concluir();

    // Reabre como a lista reabre: sem estação em correção e pelo two-way de visibilidade.
    fixture.componentRef.setInput('estacao', null);
    comp.visivel.set(true);
    fixture.detectChanges();

    expect(comp.edicao()).toBe(false);
    expect(comp.referencia()).toBe('');
    expect(comp.localEscolhido()).toBeNull();
    expect(fixture.nativeElement.querySelector('app-local-autocomplete')).toBeTruthy();
    expect(botaoPrincipal(fixture).textContent).toContain('Gerar ponto');
  });

  // ---------- degradação ----------

  it('não cria estação em local arquivado e diz o motivo', () => {
    // A API recusaria; avisar antes evita oferecer uma ação que só terminaria em erro.
    const { fixture, comp } = abrir({ local: { ...LOCAL, arquivado: true } });
    comp.referencia.set('portaria');
    fixture.detectChanges();

    comp.criar();

    expect(pontoFake.criar).not.toHaveBeenCalled();
    expect(comp.arquivado()).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="aviso-arquivado"]')).toBeTruthy();
    expect(botaoPrincipal(fixture).disabled).toBe(true);
  });

  it('permanece na confirmação quando a criação falha', () => {
    const { comp } = abrir({ falha: true });
    preencher(comp);

    comp.criar();

    expect(comp.novoPonto()).toBeNull();
    expect(comp.enviando()).toBe(false);
    expect(comp.visivel()).toBe(true);
  });

  // ---------- empilhamento (FR-019, FR-044, FR-046) ----------

  it('abre no nível de base quando é a lista que o hospeda', () => {
    const { fixture } = abrir();

    expect(painelDeCima(fixture)).toBe(0);
  });

  it('abre um nível acima quando é a ficha do Local que o hospeda', () => {
    const { fixture } = abrir({ local: LOCAL, nivel: 1 });

    expect(painelDeCima(fixture)).toBe(1);
  });

  it('deixa os dois painéis na tela ao cadastrar o local pelo campo de busca', () => {
    // FR-044: o formulário de Local acrescenta uma camada, não substitui o cadastro da estação.
    const { fixture } = abrir();
    expect(document.querySelectorAll('.p-drawer').length).toBe(1);

    campoDeLocal(fixture).abrirNovoLocal();
    fixture.detectChanges();

    expect(document.querySelectorAll('.p-drawer').length).toBe(2);
  });

  it('preserva a referência já digitada durante e depois do cadastro do local', () => {
    // O ponto da US5 (FR-046, SC-005): é exatamente o que se perderia hoje.
    const { fixture, comp } = abrir();
    comp.referencia.set('garagem');
    fixture.detectChanges();

    campoDeLocal(fixture).abrirNovoLocal();
    fixture.detectChanges();
    expect(comp.referencia()).toBe('garagem');

    const form = formularioDeLocal(fixture);
    preencherLocalNovo(form);
    form.salvar();
    fixture.detectChanges();

    expect(comp.localEscolhido()).toEqual(LOCAL_NOVO);
    expect(comp.referencia()).toBe('garagem');
    expect(comp.concluirDesabilitado()).toBe(false);
    expect(document.querySelectorAll('.p-drawer').length).toBe(1);
  });

  it('cria a estação no local recém-cadastrado sem redigitar nada', () => {
    const { fixture, comp } = abrir();
    comp.referencia.set('garagem');
    campoDeLocal(fixture).abrirNovoLocal();
    fixture.detectChanges();
    const form = formularioDeLocal(fixture);
    preencherLocalNovo(form);
    form.salvar();
    fixture.detectChanges();

    comp.criar();

    expect(pontoFake.criar).toHaveBeenCalledWith(LOCAL_NOVO.id, { referencia: 'garagem' });
  });

  it('devolve o cadastro da estação intacto quando o local é cancelado', () => {
    // FR-047: nenhum local criado, e nada do que já estava preenchido se perde.
    const { fixture, comp } = abrir();
    comp.referencia.set('garagem');
    campoDeLocal(fixture).abrirNovoLocal();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="cancelar"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(localFake.criar).not.toHaveBeenCalled();
    expect(comp.referencia()).toBe('garagem');
    expect(comp.localEscolhido()).toBeNull();
    expect(comp.visivel()).toBe(true);
    expect(document.querySelectorAll('.p-drawer').length).toBe(1);
  });
});
