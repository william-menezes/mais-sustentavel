import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { PontoService } from '@domain/ponto/apis/ponto.api';
import { PontoForm } from '@domain/ponto/components/ponto-form/ponto-form.component';
import { Ponto } from '@domain/ponto/interfaces/ponto.interface';
import { LocalDetalhe } from './local-detalhe.component';
import { Local } from '../../interfaces/local.interface';

/** Superfície interna lida pelos testes — os derivados são protegidos no componente. */
interface Interno {
  visivel: () => boolean;
  titulo: () => string;
  litrosFormatado: () => string;
  valorSocialFormatado: () => string;
  totalPontos: () => string;
  enderecoCompleto: () => string;
  cepFormatado: () => string | null;
  pontos: () => Ponto[];
  carregandoPontos: () => boolean;
  erroPontos: () => boolean;
  rotuloArquivamento: () => string;
  refCurta: (id: string) => string;
  aoEditar: () => void;
  aoAlternarArquivamento: () => void;
  aoNovoPonto: () => void;
  aoPontoCriado: () => void;
  pontoVisivel: () => boolean;
  editar: { subscribe: (fn: (local: Local) => void) => void };
  arquivar: { subscribe: (fn: (local: Local) => void) => void };
  reativar: { subscribe: (fn: (local: Local) => void) => void };
}

const COMPLETO: Local = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  nome: 'Condomínio Jardim das Acácias',
  tipo: 'CONDOMINIO',
  cep: '38408100',
  rua: 'Rua das Acácias',
  numero: '320',
  complemento: null,
  bairro: 'Santa Mônica',
  cidade: 'Uberlândia',
  uf: 'MG',
  arquivado: false,
  criadoEm: '2026-01-10T12:00:00',
};

/** Local vindo do modelo antigo: o texto livre ficou em `rua`, os demais componentes são nulos. */
const MIGRADO: Local = {
  ...COMPLETO,
  id: 'ffffffff-0000-1111-2222-333333333333',
  nome: 'Migrado',
  cep: null,
  rua: 'Rua das Flores, 100 - Centro',
  numero: null,
  bairro: null,
  cidade: null,
  uf: null,
};

const PONTO: Ponto = {
  id: '12345678-9abc-def0-1234-56789abcdef0',
  localId: COMPLETO.id,
  localNome: COMPLETO.nome,
  referencia: 'portaria',
  qrConteudo: 'conteudo',
  qrImagemUrl: '/api/pontos/1/qr',
  arquivado: false,
  criadoEm: '2026-07-11T12:00:00',
};

describe('LocalDetalhe', () => {
  let pontoFake: { listar: ReturnType<typeof vi.fn> };

  function abrir(
    opcoes: {
      local?: Local | null;
      litros?: number | null;
      valorSocial?: number | null;
      pontos?: Ponto[] | 'falha';
      visivel?: boolean;
    } = {},
  ): { fixture: ComponentFixture<LocalDetalhe>; comp: Interno } {
    const pontos = opcoes.pontos ?? [];
    pontoFake = {
      listar: vi
        .fn()
        .mockReturnValue(pontos === 'falha' ? throwError(() => new Error('fora')) : of(pontos)),
    };

    TestBed.configureTestingModule({
      imports: [LocalDetalhe],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: PontoService, useValue: pontoFake },
        // O painel de novo ponto é filho desta ficha e injeta MessageService no construtor, mesmo
        // fechado. Na aplicação quem provê é a página, que já tem o <p-toast>.
        MessageService,
      ],
    });

    const fixture = TestBed.createComponent(LocalDetalhe);
    fixture.componentRef.setInput('local', 'local' in opcoes ? opcoes.local : COMPLETO);
    fixture.componentRef.setInput('litros', opcoes.litros ?? null);
    fixture.componentRef.setInput('valorSocial', opcoes.valorSocial ?? null);
    fixture.componentRef.setInput('visivel', opcoes.visivel ?? true);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  /** O Intl separa "R$" do número com espaço fino insecável; comparar exige normalizar. */
  function semEspacoRigido(texto: string): string {
    return texto.replace(/ | /g, ' ');
  }

  // ---------- cabeçalho ----------

  it('usa o nome do local como título', () => {
    const { comp } = abrir();

    expect(comp.titulo()).toBe('Condomínio Jardim das Acácias');
  });

  it('mostra o rótulo do tipo em pt-BR e a situação ativa', () => {
    const { fixture } = abrir();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Condomínio');
    expect(texto).toContain('Ativo');
  });

  it('mostra a situação arquivada quando o local está arquivado', () => {
    const { fixture } = abrir({ local: { ...COMPLETO, arquivado: true } });
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Arquivado');
  });

  // ---------- indicadores ----------

  it('formata litros e valor social com separador de milhar pt-BR', () => {
    const { comp } = abrir({ litros: 1842, valorSocial: 1842 });

    expect(comp.litrosFormatado()).toBe('1.842 L');
    expect(semEspacoRigido(comp.valorSocialFormatado())).toBe('R$ 1.842');
  });

  it('mostra traço nos indicadores quando o agregado de impacto está indisponível', () => {
    // Zero diria que o local não recolhe nada; traço diz que o dado não veio.
    const { comp } = abrir({ litros: null, valorSocial: null });

    expect(comp.litrosFormatado()).toBe('—');
    expect(comp.valorSocialFormatado()).toBe('—');
  });

  it('mostra zero para local ativo que ainda não recolheu', () => {
    const { comp } = abrir({ litros: 0, valorSocial: 0 });

    expect(comp.litrosFormatado()).toBe('0 L');
    expect(semEspacoRigido(comp.valorSocialFormatado())).toBe('R$ 0');
  });

  it('conta os pontos carregados no indicador', () => {
    const { comp } = abrir({ pontos: [PONTO, { ...PONTO, id: 'outro-ponto-9999' }] });

    expect(comp.totalPontos()).toBe('2');
  });

  it('mostra traço na contagem de pontos quando a busca falha', () => {
    const { comp } = abrir({ pontos: 'falha' });

    expect(comp.totalPontos()).toBe('—');
  });

  // ---------- endereço ----------

  it('monta o endereço completo numa linha', () => {
    const { comp } = abrir();

    expect(comp.enderecoCompleto()).toBe('Rua das Acácias, 320 — Santa Mônica · Uberlândia, MG');
  });

  it('inclui o complemento quando informado', () => {
    const { comp } = abrir({ local: { ...COMPLETO, complemento: 'Bloco B' } });

    expect(comp.enderecoCompleto()).toBe(
      'Rua das Acácias, 320, Bloco B — Santa Mônica · Uberlândia, MG',
    );
  });

  it('omite os componentes ausentes do local migrado sem deixar separador solto', () => {
    const { comp } = abrir({ local: MIGRADO });

    expect(comp.enderecoCompleto()).toBe('Rua das Flores, 100 - Centro');
  });

  it('formata o CEP com máscara', () => {
    const { comp } = abrir();

    expect(comp.cepFormatado()).toBe('38408-100');
  });

  it('não exibe CEP quando o local não tem', () => {
    const { comp } = abrir({ local: MIGRADO });

    expect(comp.cepFormatado()).toBeNull();
  });

  // ---------- pontos ----------

  it('busca os pontos do local ao abrir', () => {
    const { comp } = abrir({ pontos: [PONTO] });

    expect(pontoFake.listar).toHaveBeenCalledWith(COMPLETO.id);
    expect(comp.pontos().length).toBe(1);
    expect(comp.carregandoPontos()).toBe(false);
    expect(comp.erroPontos()).toBe(false);
  });

  it('não busca pontos com o painel fechado', () => {
    abrir({ visivel: false, pontos: [PONTO] });

    expect(pontoFake.listar).not.toHaveBeenCalled();
  });

  it('abrevia o id do ponto para oito caracteres', () => {
    const { comp } = abrir({ pontos: [PONTO] });

    expect(comp.refCurta(PONTO.id)).toBe('12345678');
  });

  it('lista o ponto com a referência curta e a data de criação', () => {
    const { fixture } = abrir({ pontos: [PONTO] });
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('12345678');
    expect(texto).toContain('11/07/2026');
  });

  it('marca o ponto arquivado na lista', () => {
    const { fixture } = abrir({ pontos: [{ ...PONTO, arquivado: true }] });

    expect(fixture.nativeElement.querySelector('[data-testid="ponto-arquivado"]')).toBeTruthy();
  });

  it('avisa quando o local não tem nenhum ponto', () => {
    const { fixture } = abrir({ pontos: [] });

    expect(fixture.nativeElement.querySelector('[data-testid="pontos-vazio"]')).toBeTruthy();
  });

  it('avisa discretamente quando a busca de pontos falha, sem derrubar o painel', () => {
    const { fixture, comp } = abrir({ pontos: 'falha' });

    expect(comp.erroPontos()).toBe(true);
    expect(comp.carregandoPontos()).toBe(false);
    expect(comp.visivel()).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="pontos-erro"]')).toBeTruthy();
    // O resto do painel segue renderizado: a falha é de uma seção, não da tela.
    expect(fixture.nativeElement.textContent as string).toContain('Rua das Acácias');
  });

  it('faz uma única chamada para a lista de pontos, sem uma por ponto', () => {
    // Nome, litros e última coleta por ponto não existem na API; buscá-los seria N+1.
    abrir({ pontos: [PONTO, { ...PONTO, id: 'segundo' }, { ...PONTO, id: 'terceiro' }] });

    expect(pontoFake.listar).toHaveBeenCalledTimes(1);
  });

  // ---------- ações ----------

  it('projeta o próprio rodapé no lugar dos botões de formulário', () => {
    // Guarda de regressão do slot `[acoes]`: um seletor que não casa cairia no corpo do painel e
    // o rodapé voltaria a ser Cancelar/Salvar — ações que não existem numa tela de leitura.
    const { fixture } = abrir();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('[data-testid="alternar-arquivamento"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="editar"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="novo-ponto"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="salvar"]')).toBeFalsy();
    expect(raiz.querySelector('[data-testid="cancelar"]')).toBeFalsy();
  });

  it('mostra o X de fechar, única saída sem Cancelar no rodapé', () => {
    const { fixture } = abrir();

    expect(fixture.nativeElement.querySelector('.p-drawer-close-button')).toBeTruthy();
  });

  it('desabilita as ações do rodapé sem local', () => {
    const { fixture } = abrir({ local: null });
    const editar = fixture.nativeElement.querySelector('[data-testid="editar"]') as HTMLButtonElement;

    expect(editar.disabled).toBe(true);
  });

  // Os dois rótulos ficam em testes separados porque cada `abrir` configura o próprio TestBed, que
  // não aceita reconfiguração depois de instanciar um componente.

  it('oferece arquivar para local ativo', () => {
    const { comp } = abrir();

    expect(comp.rotuloArquivamento()).toBe('Arquivar local');
  });

  it('oferece reativar para local arquivado', () => {
    const { comp } = abrir({ local: { ...COMPLETO, arquivado: true } });

    expect(comp.rotuloArquivamento()).toBe('Reativar local');
  });

  it('emite editar e fecha o painel', () => {
    const { comp } = abrir();
    let emitido: Local | undefined;
    comp.editar.subscribe((local) => (emitido = local));

    comp.aoEditar();

    expect(emitido).toEqual(COMPLETO);
    expect(comp.visivel()).toBe(false);
  });

  it('emite arquivar para local ativo', () => {
    const { comp } = abrir();
    let arquivou: Local | undefined;
    let reativou: Local | undefined;
    comp.arquivar.subscribe((local) => (arquivou = local));
    comp.reativar.subscribe((local) => (reativou = local));

    comp.aoAlternarArquivamento();

    expect(arquivou).toEqual(COMPLETO);
    expect(reativou).toBeUndefined();
    expect(comp.visivel()).toBe(false);
  });

  it('emite reativar para local arquivado', () => {
    const alvo = { ...COMPLETO, arquivado: true };
    const { comp } = abrir({ local: alvo });
    let arquivou: Local | undefined;
    let reativou: Local | undefined;
    comp.arquivar.subscribe((local) => (arquivou = local));
    comp.reativar.subscribe((local) => (reativou = local));

    comp.aoAlternarArquivamento();

    expect(reativou).toEqual(alvo);
    expect(arquivou).toBeUndefined();
  });

  it('abre o cadastro de ponto empilhado, sem fechar a ficha', () => {
    // O empilhamento é o ponto: editar e arquivar fecham porque o dado exibido muda, mas ao criar um
    // ponto o Gestor volta para esta mesma ficha — agora com o ponto novo na lista.
    const { comp } = abrir();

    comp.aoNovoPonto();

    expect(comp.pontoVisivel()).toBe(true);
    expect(comp.visivel()).toBe(true);
  });

  it('abre o cadastro de ponto com este local já escolhido', () => {
    // Aberto pela ficha, o local é sabido: o painel não pode pedir de novo o que está na tela atrás.
    const { fixture, comp } = abrir();

    comp.aoNovoPonto();
    fixture.detectChanges();
    const painel = fixture.debugElement.query(By.directive(PontoForm))
      .componentInstance as PontoForm;

    expect(painel.local()).toEqual(COMPLETO);
  });

  it('abre o cadastro de ponto no nível de cima da pilha', () => {
    // Esta ficha é o painel de base; o cadastro entra um nível acima, senão os dois se sobrepõem
    // exatamente e o de baixo desaparece aos olhos de quem precisa voltar para ele (FR-044).
    const { fixture, comp } = abrir();

    comp.aoNovoPonto();
    fixture.detectChanges();
    const painel = fixture.debugElement.query(By.directive(PontoForm))
      .componentInstance as PontoForm;

    expect(painel.nivel()).toBe(1);
  });

  it('deixa os dois painéis na tela ao empilhar', () => {
    // A asserção que corresponde ao pedido: o painel de cima **acrescenta** uma camada, não
    // substitui a de baixo. Contar sinais não provaria isso; contar painéis no DOM prova.
    const { fixture, comp } = abrir();
    expect(document.querySelectorAll('.p-drawer').length).toBe(1);

    comp.aoNovoPonto();
    fixture.detectChanges();

    expect(document.querySelectorAll('.p-drawer').length).toBe(2);
  });

  it('recarrega a lista de pontos depois de criar um', () => {
    const { comp } = abrir({ pontos: [PONTO] });
    expect(pontoFake.listar).toHaveBeenCalledTimes(1);

    comp.aoPontoCriado();

    expect(pontoFake.listar).toHaveBeenCalledTimes(2);
    expect(pontoFake.listar).toHaveBeenLastCalledWith(COMPLETO.id);
  });

  it('não emite ação nenhuma sem local', () => {
    const { comp } = abrir({ local: null });
    let emitiu = false;
    comp.editar.subscribe(() => (emitiu = true));
    comp.arquivar.subscribe(() => (emitiu = true));

    comp.aoEditar();
    comp.aoAlternarArquivamento();
    comp.aoNovoPonto();

    expect(emitiu).toBe(false);
    expect(comp.pontoVisivel()).toBe(false);
    expect(pontoFake.listar).not.toHaveBeenCalled();
  });
});
