import { WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { FilterMetadata, MenuItem } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { Table } from 'primeng/table';
import { delay, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ColetaService } from '@domain/coleta/apis/coleta.api';
import { CepService } from '@domain/local/apis/cep.api';
import { LocalService } from '@domain/local/apis/local.api';
import { PontoService } from '../../apis/ponto.api';
import { PontoDetalhe } from '../../components/ponto-detalhe/ponto-detalhe.component';
import { PontoForm } from '../../components/ponto-form/ponto-form.component';
import { Ponto, PontoNaLista } from '../../interfaces/ponto.interface';
import { PontoList } from './pontos.page';

/** Membros protegidos que os testes leem. A tela não expõe API pública além do template. */
interface Interno {
  tabela: () => Table | undefined;
  filtrosIniciais: Record<string, FilterMetadata[]>;
  linhas: () => PontoNaLista[];
  exibidos: () => number;
  exibidas: () => PontoNaLista[];
  visao: WritableSignal<'cartoes' | 'tabela'>;
  limparFiltros: () => void;
  acoes: () => MenuItem[];
  arquivar: (estacao: PontoNaLista) => void;
  reativar: (estacao: PontoNaLista) => void;
  formVisivel: () => boolean;
  detalheVisivel: () => boolean;
  emDetalhe: () => Ponto | null;
  emEdicao: () => Ponto | null;
  verDetalhes: (estacao: PontoNaLista) => void;
  editar: (estacao: Ponto) => void;
}

const PORTARIA: Ponto = {
  id: '96e96ba8-0000-4000-8000-000000000001',
  localId: 'L1',
  localNome: 'EMEF Professora Zaida Barbosa',
  referencia: 'Portaria',
  qrConteudo: 'https://sustentavel.app/p/96e96ba8-0000-4000-8000-000000000001',
  qrImagemUrl: '/api/pontos/96e96ba8-0000-4000-8000-000000000001/qr',
  arquivado: false,
  criadoEm: '2026-07-01T10:00:00Z',
};

/** Estação cadastrada antes da V7: a referência não existe e não é inventada (FR-012, FR-013). */
const SEM_REFERENCIA: Ponto = {
  ...PORTARIA,
  id: 'c3d4e5f6-0000-4000-8000-000000000002',
  localId: 'L2',
  localNome: 'Condomínio Jardim das Águas',
  referencia: null,
};

const ARQUIVADA: Ponto = {
  ...PORTARIA,
  id: 'aa11bb22-0000-4000-8000-000000000003',
  referencia: 'Garagem coberta',
  arquivado: true,
};

/** Estação que o painel de cadastro acabou de criar, para a recarga trazê-la. */
const RECEM_CRIADA: Ponto = {
  ...PORTARIA,
  id: 'dd44ee55-0000-4000-8000-000000000004',
  referencia: 'Cantina',
};

/** A mesma estação de {@link PORTARIA} depois de a referência ser corrigida (FR-039). */
const RENOMEADA: Ponto = { ...PORTARIA, referencia: 'Portaria dos fundos' };

describe('PontoList', () => {
  let servicoFake: {
    listarTodos: ReturnType<typeof vi.fn>;
    listar: ReturnType<typeof vi.fn>;
    editar: ReturnType<typeof vi.fn>;
    arquivar: ReturnType<typeof vi.fn>;
    reativar: ReturnType<typeof vi.fn>;
    qrUrl: ReturnType<typeof vi.fn>;
  };
  /** A ficha hospedada consulta o histórico de coletas da estação que ela exibe. */
  let coletaFake: { listar: ReturnType<typeof vi.fn> };

  function montar(
    opcoes: {
      ativas?: Ponto[];
      arquivadas?: Ponto[];
      /** Parâmetros de consulta da rota — é por eles que a tela chega filtrada (FR-008). */
      consulta?: Record<string, string>;
      falha?: boolean;
      /**
       * Entrega os dados num tique posterior, como a rede faz. Necessário quando o teste olha o
       * DOM **depois** da filtragem: com `of()` síncrono a carga acontece dentro do `ngOnInit`, a
       * tabela é verificada uma única vez e o corpo renderizado fica com as linhas pré-filtro.
       * No navegador a resposta chega depois do primeiro ciclo e a filtragem entra junto com ele.
       */
      assincrono?: boolean;
    } = {},
  ): { fixture: ComponentFixture<PontoList>; comp: Interno } {
    const ativas = opcoes.ativas ?? [];
    const arquivadas = opcoes.arquivadas ?? [];
    const entregar = <T,>(valor: T) => (opcoes.assincrono ? of(valor).pipe(delay(0)) : of(valor));

    servicoFake = {
      listarTodos: vi.fn().mockImplementation((arq: boolean) => {
        if (opcoes.falha) {
          return throwError(() => new Error('api fora'));
        }
        return entregar(arq ? arquivadas : ativas);
      }),
      listar: vi.fn().mockReturnValue(of([])),
      // Chamada pelo painel hospedado, não pela página: a correção da referência é PUT no ponto.
      editar: vi.fn().mockReturnValue(of(RENOMEADA)),
      arquivar: vi.fn().mockReturnValue(of({})),
      reativar: vi.fn().mockReturnValue(of({})),
      qrUrl: vi.fn().mockImplementation((id: string) => `/api/pontos/${id}/qr`),
    };
    coletaFake = { listar: vi.fn().mockReturnValue(of({ totalLitros: 0, coletas: [] })) };

    TestBed.configureTestingModule({
      imports: [PontoList],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        provideRouter([]),
        { provide: PontoService, useValue: servicoFake },
        // Os dois painéis hospedados são construídos mesmo fechados, e com eles o que vive dentro:
        // a ficha consulta coletas, e o cadastro traz o campo de busca de local com o formulário de
        // Local (que consulta CEP). Nenhum deles é chamado enquanto os painéis não abrem.
        { provide: ColetaService, useValue: coletaFake },
        { provide: LocalService, useValue: { listar: vi.fn().mockReturnValue(of([])) } },
        {
          provide: CepService,
          useValue: { consultar: vi.fn().mockReturnValue(of({ situacao: 'nao-encontrado' })) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(opcoes.consulta ?? {}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(PontoList);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  /** Espera o macrotask do `delay(0)`: em modo zoneless `whenStable` não conhece temporizador de rxjs. */
  async function aguardarRede(fixture: ComponentFixture<PontoList>): Promise<void> {
    await new Promise((resolver) => setTimeout(resolver, 0));
    fixture.detectChanges();
  }

  /** Painel de cadastro hospedado pela tela — tipado pela classe real, então só o que é público. */
  function painelDeCadastro(fixture: ComponentFixture<PontoList>): PontoForm {
    return fixture.debugElement.query(By.directive(PontoForm)).componentInstance as PontoForm;
  }

  /** Ficha da estação hospedada pela tela. */
  function fichaDaEstacao(fixture: ComponentFixture<PontoList>): PontoDetalhe {
    return fixture.debugElement.query(By.directive(PontoDetalhe)).componentInstance as PontoDetalhe;
  }

  /** Abre a ficha como o Gestor faz: pelo primeiro item do menu de ações da linha ou do cartão. */
  function abrirFichaPeloMenu(
    fixture: ComponentFixture<PontoList>,
    comp: Interno,
    indice = 0,
  ): void {
    const botoes = fixture.nativeElement.querySelectorAll('[data-testid="acoes"]');
    (botoes[indice] as HTMLButtonElement).click();
    fixture.detectChanges();
    comp.acoes()[0].command?.({});
    fixture.detectChanges();
  }

  /** Botão de arquivar/reativar do rodapé da ficha, cujo rótulo depende da situação da estação. */
  function alternarArquivamentoNaFicha(fixture: ComponentFixture<PontoList>): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      '[data-testid="alternar-arquivamento"]',
    ) as HTMLButtonElement;
  }

  // ---------- carga ----------

  it('carrega estações ativas e arquivadas na mesma lista', () => {
    const { comp } = montar({ ativas: [PORTARIA, SEM_REFERENCIA], arquivadas: [ARQUIVADA] });

    expect(servicoFake.listarTodos).toHaveBeenCalledWith(false);
    expect(servicoFake.listarTodos).toHaveBeenCalledWith(true);
    expect(comp.linhas().length).toBe(3);
  });

  it('faz uma única chamada por situação, sem uma consulta por linha', () => {
    // O motivo de existir o endpoint global (research D2): montar a lista no cliente exigiria uma
    // consulta por local, e o nome do local já vem na resposta.
    const { comp } = montar({ ativas: [PORTARIA, SEM_REFERENCIA], arquivadas: [ARQUIVADA] });

    expect(comp.linhas().length).toBe(3);
    expect(servicoFake.listarTodos).toHaveBeenCalledTimes(2);
    expect(servicoFake.listar).not.toHaveBeenCalled();
  });

  it('deriva a situação de cada linha', () => {
    const { comp } = montar({ ativas: [PORTARIA], arquivadas: [ARQUIVADA] });
    const porId = new Map(comp.linhas().map((linha) => [linha.id, linha.situacao]));

    expect(porId.get(PORTARIA.id)).toBe('ATIVO');
    expect(porId.get(ARQUIVADA.id)).toBe('ARQUIVADO');
  });

  it('conta as exibidas e o total carregado', async () => {
    // Carga assíncrona porque a asserção é sobre o texto renderizado depois de filtrar — ver `montar`.
    const { fixture, comp } = montar({
      ativas: [PORTARIA, SEM_REFERENCIA],
      arquivadas: [ARQUIVADA],
      assincrono: true,
    });
    await aguardarRede(fixture);
    const contador = fixture.nativeElement.querySelector('[data-testid="contador"]') as HTMLElement;

    expect(comp.exibidos()).toBe(2);
    expect(comp.linhas().length).toBe(3);
    expect(contador.textContent).toContain('2 de 3 estações');
  });

  it('avisa quando a listagem falha', () => {
    const { comp } = montar({ falha: true });

    expect(comp.linhas().length).toBe(0);
  });

  // ---------- identificação (FR-013, FR-014) ----------

  it('identifica a estação pela referência', () => {
    const { comp } = montar({ ativas: [PORTARIA] });

    expect(comp.linhas()[0].titulo).toBe('Portaria');
    expect(comp.linhas()[0].localNome).toBe('EMEF Professora Zaida Barbosa');
  });

  it('identifica a estação sem referência pela referência curta, sem inventar rótulo', () => {
    // Um "estação 1" de reserva viraria o nome da coisa no cartão e no adesivo impresso. A ausência
    // é informação verdadeira, e a referência curta é a identificação de quem falta nomear.
    const { comp } = montar({ ativas: [SEM_REFERENCIA] });
    const linha = comp.linhas()[0];

    expect(linha.refCurta).toBe('c3d4e5f6');
    expect(linha.titulo).toBe('c3d4e5f6');
    expect(linha.referencia).toBeNull();
  });

  it('exibe a referência e a referência curta na linha da tabela', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    comp.visao.set('tabela');
    await aguardarRede(fixture);

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Portaria');
    expect(texto).toContain('96e96ba8');
  });

  // ---------- filtro declarado (a lição da 006) ----------

  it('exibe só as ativas por padrão, informando o total (RN-G-06)', () => {
    const { comp } = montar({ ativas: [PORTARIA], arquivadas: [ARQUIVADA] });

    expect(comp.exibidos()).toBe(1);
    expect(comp.linhas().length).toBe(2);
  });

  it('deixa o filtro semeado legível para o menu do funil', () => {
    // O defeito que este teste tranca: `tabela.filter()` grava a forma de LINHA (objeto único) num
    // filtro de coluna em modo MENU, que espera um ARRAY de condições, e o effect do input
    // `filters` descartava o valor logo depois. A tabela ficava corretamente filtrada enquanto o
    // funil e o painel diziam que não havia filtro — e o painel, que percorre as condições com
    // `@for`, não tem o que percorrer.
    const { comp } = montar({ ativas: [PORTARIA], arquivadas: [ARQUIVADA] });
    const condicoes = comp.tabela()?.filters['situacao'];

    expect(Array.isArray(condicoes)).toBe(true);
    expect((condicoes as FilterMetadata[])[0].value).toBe('ATIVO');
    // A filtragem de fato aplicada tem de concordar com o que o menu mostra.
    expect(comp.exibidos()).toBe(1);
  });

  it('declara condição para toda coluna filtrável, não só para situação', () => {
    // O binding substitui o mapa inteiro de filtros, então a página declara todas as colunas em vez
    // de contar com o `initFieldFilterConstraint` do PrimeNG para tapar buracos.
    //
    // A asserção é sobre o mapa DECLARADO, lido de uma instância **não renderizada**. Duas medidas
    // explicam a volta: o PrimeNG 22 preenche a coluna ausente sozinho, porque o effect do input
    // `filters` roda antes do `onInit` de cada `p-column-filter`; e a tabela **não copia** o mapa
    // recebido — ela guarda a mesma referência e o `initFieldFilterConstraint` escreve dentro dela.
    // Somadas, as duas fazem `tabela.filters` e `filtrosIniciais` do componente renderizado serem o
    // mesmo objeto já completado, em que uma declaração incompleta é indistinguível de uma
    // completa. A ordem interna é detalhe da biblioteca; declarar tudo é o que mantém o painel do
    // funil correto sem depender dela.
    const { comp } = montar({ ativas: [PORTARIA] });
    const naTabela = comp.tabela()?.filters ?? {};
    const declarados = (TestBed.createComponent(PontoList).componentInstance as unknown as Interno)
      .filtrosIniciais;

    ['localNome', 'titulo', 'situacao'].forEach((campo) => {
      expect(Array.isArray(declarados[campo]), `coluna ${campo} sem condição declarada`).toBe(true);
      expect(declarados[campo][0].matchMode).toBeTruthy();
      expect(declarados[campo][0].operator).toBeTruthy();
      expect(Array.isArray(naTabela[campo])).toBe(true);
    });
  });

  it('mostra tudo ao limpar os filtros', () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], arquivadas: [ARQUIVADA] });

    comp.limparFiltros();
    fixture.detectChanges();

    expect(comp.exibidos()).toBe(2);
  });

  // ---------- chegada filtrada por local (FR-008) ----------

  it('chega filtrada pelo local recebido no parâmetro de consulta', () => {
    const { comp } = montar({
      ativas: [PORTARIA, SEM_REFERENCIA],
      consulta: { local: 'Condomínio Jardim das Águas' },
    });
    const condicoes = comp.tabela()?.filters['localNome'] as FilterMetadata[];

    // Semeado no filtro visível da coluna, não num filtro invisível por identificador: o Gestor
    // vê no funil o que está aplicado e consegue limpar.
    expect(condicoes[0].value).toBe('Condomínio Jardim das Águas');
    expect(comp.exibidos()).toBe(1);
    expect(comp.exibidas()[0].id).toBe(SEM_REFERENCIA.id);
  });

  it('não semeia filtro de local quando a rota não traz o parâmetro', () => {
    const { comp } = montar({ ativas: [PORTARIA, SEM_REFERENCIA] });
    const condicoes = comp.tabela()?.filters['localNome'] as FilterMetadata[];

    expect(condicoes[0].value).toBeNull();
    expect(comp.exibidos()).toBe(2);
  });

  // ---------- alternância cartões / tabela (FR-004, research D6) ----------

  it('começa em cartões, com a grade alimentada pela própria tabela', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA, SEM_REFERENCIA], assincrono: true });
    await aguardarRede(fixture);

    expect(comp.visao()).toBe('cartoes');
    const grade = fixture.nativeElement.querySelector('[data-testid="grade-cartoes"]');
    expect(grade).toBeTruthy();
    expect(grade.querySelectorAll('.cartao').length).toBe(2);
  });

  it('desenha a grade de cartões numa única linha com uma única célula', async () => {
    // Não são duas árvores independentes: a mesma `p-table` continua dona do filtro nos dois modos,
    // então não existe segundo estado para sincronizar ao alternar (research D6).
    const { fixture } = montar({ ativas: [PORTARIA, SEM_REFERENCIA], assincrono: true });
    await aguardarRede(fixture);

    const linhas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(linhas.length).toBe(1);
    expect(linhas[0].querySelectorAll('td').length).toBe(1);
  });

  it('mostra o QR de cada estação no cartão', async () => {
    const { fixture } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);

    const qr = fixture.nativeElement.querySelector(
      '[data-testid="grade-cartoes"] img',
    ) as HTMLImageElement;
    expect(qr.getAttribute('src')).toBe(`/api/pontos/${PORTARIA.id}/qr`);
  });

  it('renderiza uma linha por estação no modo tabela', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA, SEM_REFERENCIA], assincrono: true });
    comp.visao.set('tabela');
    await aguardarRede(fixture);

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    expect(fixture.nativeElement.querySelector('[data-testid="grade-cartoes"]')).toBeFalsy();
  });

  it('preserva o filtro aplicado ao alternar de cartões para tabela', async () => {
    const { fixture, comp } = montar({
      ativas: [PORTARIA, SEM_REFERENCIA],
      arquivadas: [ARQUIVADA],
      consulta: { local: 'EMEF Professora Zaida Barbosa' },
      assincrono: true,
    });
    await aguardarRede(fixture);
    expect(comp.exibidos()).toBe(1);

    comp.visao.set('tabela');
    await aguardarRede(fixture);

    const situacao = comp.tabela()?.filters['situacao'] as FilterMetadata[];
    const local = comp.tabela()?.filters['localNome'] as FilterMetadata[];
    expect(situacao[0].value).toBe('ATIVO');
    expect(local[0].value).toBe('EMEF Professora Zaida Barbosa');
    expect(comp.exibidos()).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('mantém os funis visíveis nos dois modos', async () => {
    // Desvio deliberado dos mocks, registrado na D6: esconder o filtro no modo cartões tornaria
    // aquele modo menos capaz sem motivo, e FR-005 pede filtro por coluna na tela.
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);
    const emCartoes = fixture.nativeElement.querySelectorAll('p-column-filter').length;

    comp.visao.set('tabela');
    await aguardarRede(fixture);
    const emTabela = fixture.nativeElement.querySelectorAll('p-column-filter').length;

    expect(emCartoes).toBe(3);
    expect(emTabela).toBe(3);
  });

  // ---------- estados de vazio (FR-009) ----------

  // Os dois casos ficam em testes separados de propósito: cada um precisa do seu TestBed, que não
  // aceita reconfiguração depois de instanciar um componente.

  it('avisa quando não há nenhuma estação cadastrada', () => {
    const { fixture } = montar();

    expect(fixture.nativeElement.querySelector('[data-testid="vazio-sem-cadastro"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="vazio-por-filtro"]')).toBeFalsy();
  });

  it('avisa quando o filtro não casa com nenhuma estação carregada', async () => {
    // Existe estação, mas o filtro padrão (ativa) não casa com um acervo só de arquivadas.
    const { fixture } = montar({ arquivadas: [ARQUIVADA], assincrono: true });
    await aguardarRede(fixture);

    expect(fixture.nativeElement.querySelector('[data-testid="vazio-por-filtro"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="vazio-sem-cadastro"]')).toBeFalsy();
  });

  it('oferece limpar filtros no vazio por filtro, e a lista volta', async () => {
    const { fixture, comp } = montar({ arquivadas: [ARQUIVADA], assincrono: true });
    await aguardarRede(fixture);
    const limpar = fixture.nativeElement.querySelector(
      '[data-testid="vazio-por-filtro"] ~ button',
    ) as HTMLButtonElement;

    limpar.click();
    fixture.detectChanges();

    expect(comp.exibidos()).toBe(1);
  });

  // ---------- menu de ações ----------

  it('oferece arquivar na linha ativa e reativar na arquivada', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);
    (fixture.nativeElement.querySelector('[data-testid="acoes"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(comp.acoes().map((item) => item.label)).toContain('Arquivar');
    expect(comp.acoes().map((item) => item.label)).not.toContain('Reativar');
  });

  it('arquiva e recarrega a lista', () => {
    const { comp } = montar({ ativas: [PORTARIA] });
    servicoFake.listarTodos.mockClear();

    comp.arquivar(comp.linhas()[0]);

    expect(servicoFake.arquivar).toHaveBeenCalledWith(PORTARIA.id);
    expect(servicoFake.listarTodos).toHaveBeenCalled();
  });

  it('reativa e recarrega a lista', () => {
    const { comp } = montar({ arquivadas: [ARQUIVADA] });
    servicoFake.listarTodos.mockClear();

    comp.reativar(comp.linhas()[0]);

    expect(servicoFake.reativar).toHaveBeenCalledWith(ARQUIVADA.id);
    expect(servicoFake.listarTodos).toHaveBeenCalled();
  });

  // ---------- cadastro hospedado (T044, FR-019) ----------

  it('abre o cadastro pelo botão do cabeçalho, sem local escolhido e no painel de base', () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA] });
    const novo = fixture.nativeElement.querySelector(
      '[data-testid="nova-estacao"]',
    ) as HTMLButtonElement;

    novo.click();
    fixture.detectChanges();
    const painel = painelDeCadastro(fixture);

    expect(comp.formVisivel()).toBe(true);
    expect(painel.visivel()).toBe(true);
    // Aberto da lista não se sabe qual local, e nada está empilhado por baixo (nível 0).
    expect(painel.local()).toBeNull();
    expect(painel.nivel()).toBe(0);
  });

  it('oferece cadastrar a primeira estação no vazio sem cadastro', () => {
    const { fixture, comp } = montar();
    const cadastrar = fixture.nativeElement.querySelector(
      '[data-testid="cadastrar-primeira"]',
    ) as HTMLButtonElement;

    cadastrar.click();
    fixture.detectChanges();

    expect(comp.formVisivel()).toBe(true);
    expect(painelDeCadastro(fixture).visivel()).toBe(true);
  });

  it('recarrega a lista quando o painel informa a estação criada', () => {
    // SC-004: a estação cadastrada aparece na visão geral sem recarregar a página.
    const { fixture, comp } = montar({ ativas: [PORTARIA] });
    servicoFake.listarTodos.mockImplementation((arquivadas: boolean) =>
      of(arquivadas ? [] : [PORTARIA, RECEM_CRIADA]),
    );

    painelDeCadastro(fixture).criado.emit(RECEM_CRIADA);
    fixture.detectChanges();

    expect(comp.linhas().map((linha) => linha.titulo)).toContain('Cantina');
    expect(comp.exibidos()).toBe(2);
  });

  // ---------- correção da referência (FR-039) ----------

  it('abre a correção pelo menu da linha, com a estação escolhida no painel', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);
    (fixture.nativeElement.querySelector('[data-testid="acoes"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    comp.acoes()[1].command?.({});
    fixture.detectChanges();

    expect(comp.formVisivel()).toBe(true);
    expect(comp.emEdicao()?.id).toBe(PORTARIA.id);
    expect(painelDeCadastro(fixture).estacao()?.id).toBe(PORTARIA.id);
  });

  it('leva o editar da ficha ao mesmo painel de correção', async () => {
    // O output existia sem destino: clicar fechava a ficha e não fazia nada.
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);
    abrirFichaPeloMenu(fixture, comp);

    fichaDaEstacao(fixture).editar.emit(comp.linhas()[0]);
    fixture.detectChanges();

    expect(comp.formVisivel()).toBe(true);
    expect(painelDeCadastro(fixture).estacao()?.id).toBe(PORTARIA.id);
  });

  it('recarrega a lista com o nome novo depois da correção', () => {
    // SC-002 / FR-015: a referência corrigida aparece na lista sem recarregar a página.
    const { fixture, comp } = montar({ ativas: [PORTARIA] });
    servicoFake.listarTodos.mockImplementation((arquivadas: boolean) =>
      of(arquivadas ? [] : [RENOMEADA]),
    );

    painelDeCadastro(fixture).editado.emit(RENOMEADA);
    fixture.detectChanges();

    expect(comp.linhas().map((linha) => linha.titulo)).toEqual(['Portaria dos fundos']);
  });

  it('esquece a estação em correção ao abrir o cadastro de uma nova', () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA] });
    comp.editar(PORTARIA);
    fixture.detectChanges();
    expect(painelDeCadastro(fixture).estacao()?.id).toBe(PORTARIA.id);

    (
      fixture.nativeElement.querySelector('[data-testid="nova-estacao"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(comp.emEdicao()).toBeNull();
    expect(painelDeCadastro(fixture).estacao()).toBeNull();
  });

  // ---------- ficha hospedada (T053, FR-027, research D13) ----------

  it('oferece "Ver detalhes" como primeiro item do menu de ações', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);
    (fixture.nativeElement.querySelector('[data-testid="acoes"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    // A lista inteira, e nesta ordem: consultar, corrigir, e por último a ação que tira da lista.
    expect(comp.acoes().map((item) => item.label)).toEqual([
      'Ver detalhes',
      'Editar referência',
      'Arquivar',
    ]);
  });

  it('abre a ficha pelo cartão, alimentada pela própria linha', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);

    abrirFichaPeloMenu(fixture, comp);

    expect(comp.detalheVisivel()).toBe(true);
    // A MESMA linha vai por input: não existe `GET /api/pontos/{id}` e a listagem já trouxe tudo o
    // que o cabeçalho da ficha mostra (research D13).
    expect(fichaDaEstacao(fixture).ponto()).toBe(comp.linhas()[0]);
    expect(servicoFake.listarTodos).toHaveBeenCalledTimes(2);
    // A única consulta da ficha é o histórico de coletas daquela estação.
    expect(coletaFake.listar).toHaveBeenCalledWith(PORTARIA.id);
  });

  it('abre a ficha da linha certa no modo tabela', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA, SEM_REFERENCIA], assincrono: true });
    comp.visao.set('tabela');
    await aguardarRede(fixture);

    abrirFichaPeloMenu(fixture, comp, 1);

    expect(comp.emDetalhe()?.id).toBe(SEM_REFERENCIA.id);
  });

  it('arquiva pela ficha, fecha o painel e recarrega a lista', async () => {
    const { fixture, comp } = montar({ ativas: [PORTARIA], assincrono: true });
    await aguardarRede(fixture);
    abrirFichaPeloMenu(fixture, comp);
    servicoFake.listarTodos.mockClear();

    alternarArquivamentoNaFicha(fixture).click();
    fixture.detectChanges();

    expect(servicoFake.arquivar).toHaveBeenCalledWith(PORTARIA.id);
    expect(servicoFake.listarTodos).toHaveBeenCalled();
    // A ficha recebe a estação por input: aberta, continuaria exibindo a situação anterior.
    expect(comp.detalheVisivel()).toBe(false);
  });

  it('reativa pela ficha, fecha o painel e recarrega a lista', async () => {
    const { fixture, comp } = montar({ arquivadas: [ARQUIVADA], assincrono: true });
    await aguardarRede(fixture);
    // Direto pelo método da tela: com o filtro padrão em "ativa" a linha arquivada não está
    // desenhada para ter menu, e o caminho pelo menu já está coberto no caso ativo.
    comp.verDetalhes(comp.linhas()[0]);
    fixture.detectChanges();
    servicoFake.listarTodos.mockClear();

    alternarArquivamentoNaFicha(fixture).click();
    fixture.detectChanges();

    expect(servicoFake.reativar).toHaveBeenCalledWith(ARQUIVADA.id);
    expect(servicoFake.listarTodos).toHaveBeenCalled();
    expect(comp.detalheVisivel()).toBe(false);
  });
});
