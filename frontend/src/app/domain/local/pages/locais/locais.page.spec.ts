import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router, provideRouter } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { FilterMetadata, MenuItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { providePrimeNG } from 'primeng/config';
import { delay, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ImpactoService } from '@domain/impacto/apis/impacto.api';
import { ValorSocialLocal } from '@domain/impacto/interfaces/impacto.interface';
import { PontoService } from '@domain/ponto/apis/ponto.api';
import { LocalList } from './locais.page';
import { LocalService } from '../../apis/local.api';
import { Local, LocalNaLista } from '../../interfaces/local.interface';

interface Interno {
  tabela: () => Table | undefined;
  linhas: () => LocalNaLista[];
  exibidos: () => number;
  litrosFormatado: (linha: LocalNaLista) => string;
  enderecoResumido: (local: Local) => string;
  limparFiltros: () => void;
  arquivar: (local: Local) => void;
  acoes: () => MenuItem[];
  verDetalhes: (local: Local) => void;
  detalheVisivel: () => boolean;
  emDetalhe: () => Local | null;
  litrosDoDetalhe: () => number | null;
  valorSocialDoDetalhe: () => number | null;
  verPontos: (local: Local) => void;
  editar: (local: Local) => void;
  formVisivel: () => boolean;
  emEdicao: () => Local | null;
}

const ATIVO: Local = {
  id: '1',
  nome: 'EMEF Professora Zaida Barbosa',
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

const ARQUIVADO: Local = { ...ATIVO, id: '2', nome: 'Colégio Fechado', arquivado: true };

/** Local vindo do modelo antigo: o texto livre ficou em `rua`, o resto é nulo. */
const MIGRADO: Local = {
  ...ATIVO,
  id: '3',
  nome: 'Migrado',
  cep: null,
  rua: 'Rua das Flores, 100 - Centro',
  numero: null,
  bairro: null,
  cidade: null,
  uf: null,
};

describe('LocalList', () => {
  let localFake: {
    listar: ReturnType<typeof vi.fn>;
    arquivar: ReturnType<typeof vi.fn>;
    reativar: ReturnType<typeof vi.fn>;
  };
  let impactoFake: { porLocal: ReturnType<typeof vi.fn> };
  let pontoFake: { listar: ReturnType<typeof vi.fn> };

  function montar(
    opcoes: {
      ativos?: Local[];
      arquivados?: Local[];
      litros?: ValorSocialLocal[] | 'falha';
      /**
       * Entrega os dados num tique posterior, como a rede faz. Necessário quando o teste olha o
       * DOM **depois** da filtragem: com `of()` síncrono a carga acontece dentro do `ngOnInit`, a
       * tabela é verificada uma única vez e o corpo renderizado fica com as linhas pré-filtro.
       * No navegador a resposta chega depois do primeiro ciclo e a filtragem entra junto com ele.
       */
      assincrono?: boolean;
    } = {},
  ): { fixture: ComponentFixture<LocalList>; comp: Interno } {
    const ativos = opcoes.ativos ?? [];
    const arquivados = opcoes.arquivados ?? [];
    const entregar = <T,>(valor: T) => (opcoes.assincrono ? of(valor).pipe(delay(0)) : of(valor));

    localFake = {
      listar: vi.fn().mockImplementation((arq: boolean) => entregar(arq ? arquivados : ativos)),
      arquivar: vi.fn().mockReturnValue(of({})),
      reativar: vi.fn().mockReturnValue(of({})),
    };
    impactoFake = {
      porLocal: vi
        .fn()
        .mockReturnValue(
          opcoes.litros === 'falha' ? throwError(() => new Error('impacto fora')) : of(opcoes.litros ?? []),
        ),
    };
    // O painel de detalhe é filho da página e injeta PontoService no construtor, mesmo fechado.
    pontoFake = { listar: vi.fn().mockReturnValue(of([])) };

    TestBed.configureTestingModule({
      imports: [LocalList],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        provideRouter([]),
        { provide: LocalService, useValue: localFake },
        { provide: ImpactoService, useValue: impactoFake },
        { provide: PontoService, useValue: pontoFake },
      ],
    });

    const fixture = TestBed.createComponent(LocalList);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  it('carrega ativos e arquivados na mesma lista', () => {
    const { comp } = montar({ ativos: [ATIVO], arquivados: [ARQUIVADO] });

    expect(localFake.listar).toHaveBeenCalledWith(false);
    expect(localFake.listar).toHaveBeenCalledWith(true);
    expect(comp.linhas().length).toBe(2);
  });

  it('deriva a situação de cada linha', () => {
    const { comp } = montar({ ativos: [ATIVO], arquivados: [ARQUIVADO] });
    const porId = new Map(comp.linhas().map((linha) => [linha.id, linha.situacao]));

    expect(porId.get('1')).toBe('ATIVO');
    expect(porId.get('2')).toBe('ARQUIVADO');
  });

  it('exibe só os ativos por padrão, informando o total (RN-G-06)', () => {
    const { comp } = montar({ ativos: [ATIVO], arquivados: [ARQUIVADO] });

    expect(comp.exibidos()).toBe(1);
    expect(comp.linhas().length).toBe(2);
  });

  it('deixa o filtro semeado legível para o menu do funil', () => {
    // O defeito que este teste tranca: `tabela.filter()` grava a forma de LINHA (objeto único) num
    // filtro de coluna em modo MENU, que espera um ARRAY de condições, e o effect do input
    // `filters` descartava o valor logo depois. A tabela ficava corretamente filtrada enquanto o
    // funil e o painel diziam que não havia filtro — e o painel, que percorre as condições com
    // `@for`, não tem o que percorrer.
    const { comp } = montar({ ativos: [ATIVO], arquivados: [ARQUIVADO] });
    const condicoes = comp.tabela()?.filters['situacao'];

    expect(Array.isArray(condicoes)).toBe(true);
    expect((condicoes as FilterMetadata[])[0].value).toBe('ATIVO');
    // A filtragem de fato aplicada tem de concordar com o que o menu mostra.
    expect(comp.exibidos()).toBe(1);
  });

  it('declara condição para toda coluna filtrável, não só para situação', () => {
    // Lê o mapa DECLARADO, de um componente ainda não renderizado, e é essencial que seja assim: a
    // `p-table` não copia o mapa de filtros — guarda a mesma referência e o `initFieldFilterConstraint`
    // escreve dentro dela, preenchendo as colunas que faltaram. Ler `tabela().filters` de um componente
    // renderizado passaria mesmo com uma coluna não declarada, porque a própria biblioteca a teria
    // acrescentado. A versão anterior deste teste fazia exatamente isso e era vacuosa.
    TestBed.configureTestingModule({
      imports: [LocalList],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        provideRouter([]),
        { provide: LocalService, useValue: { listar: vi.fn().mockReturnValue(of([])) } },
        { provide: ImpactoService, useValue: { porLocal: vi.fn().mockReturnValue(of([])) } },
        { provide: PontoService, useValue: { listar: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    // Sem `detectChanges`: nenhum `p-column-filter` chegou a existir para completar o mapa.
    const naoRenderizado = TestBed.createComponent(LocalList)
      .componentInstance as unknown as { filtrosIniciais: Record<string, unknown> };

    ['nome', 'tipo', 'litros', 'situacao'].forEach((campo) => {
      expect(Array.isArray(naoRenderizado.filtrosIniciais[campo])).toBe(true);
    });
  });

  it('mostra tudo ao limpar os filtros', () => {
    const { fixture, comp } = montar({ ativos: [ATIVO], arquivados: [ARQUIVADO] });

    comp.limparFiltros();
    fixture.detectChanges();

    expect(comp.exibidos()).toBe(2);
  });

  it('exibe os litros do local com coleta', () => {
    const { comp } = montar({
      ativos: [ATIVO],
      litros: [{ localId: '1', localNome: ATIVO.nome, litrosReais: 1610, valorSocial: 1610 }],
    });

    expect(comp.linhas()[0].litros).toBe(1610);
    expect(comp.litrosFormatado(comp.linhas()[0])).toContain('L');
  });

  it('exibe zero litros para local sem coleta', () => {
    const { comp } = montar({ ativos: [ATIVO], litros: [] });

    expect(comp.linhas()[0].litros).toBe(0);
    expect(comp.litrosFormatado(comp.linhas()[0])).toBe('0 L');
  });

  it('exibe traço quando o agregado de impacto está indisponível', () => {
    // Zero diria que o local não opera; traço diz que o dado não veio. A lista renderiza igual.
    const { comp } = montar({ ativos: [ATIVO], litros: 'falha' });

    expect(comp.linhas().length).toBe(1);
    expect(comp.linhas()[0].litros).toBeNull();
    expect(comp.litrosFormatado(comp.linhas()[0])).toBe('—');
  });

  it('resume o endereço como "rua, número — bairro"', () => {
    const { comp } = montar();

    expect(comp.enderecoResumido(ATIVO)).toBe('Avenida João Naves de Ávila, 1841 — Saraiva');
  });

  it('resume o endereço de local migrado sem inventar separadores', () => {
    const { comp } = montar();

    expect(comp.enderecoResumido(MIGRADO)).toBe('Rua das Flores, 100 - Centro');
  });

  it('arquiva e recarrega a lista', () => {
    const { comp } = montar({ ativos: [ATIVO] });
    localFake.listar.mockClear();

    comp.arquivar(ATIVO);

    expect(localFake.arquivar).toHaveBeenCalledWith('1');
    expect(localFake.listar).toHaveBeenCalled();
  });

  // Os dois casos de lista vazia ficam em testes separados de propósito: cada um precisa do seu
  // TestBed, que não aceita reconfiguração depois de instanciar um componente.

  it('avisa quando não há nenhum local cadastrado', () => {
    const { fixture } = montar();

    expect(fixture.nativeElement.querySelector('[data-testid="vazio-sem-cadastro"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="vazio-por-filtro"]')).toBeFalsy();
  });

  it('avisa quando o filtro não casa com nenhum local carregado', async () => {
    // Existe local, mas o filtro padrão (ativo) não casa com um acervo só de arquivados.
    // Carga assíncrona porque a asserção é sobre o DOM depois de filtrar — ver `montar`.
    const { fixture } = montar({ arquivados: [ARQUIVADO], assincrono: true });
    // Espera o macrotask do `delay(0)`: em modo zoneless o `whenStable` não conhece temporizador de
    // rxjs, então aguardar por ele passaria direto, antes de os dados chegarem.
    await new Promise((resolver) => setTimeout(resolver, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="vazio-por-filtro"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="vazio-sem-cadastro"]')).toBeFalsy();
  });

  // ---------- painel de detalhe ----------

  it('oferece "Ver detalhes" como primeiro item do menu de ações', () => {
    const { fixture, comp } = montar({ ativos: [ATIVO] });
    const botao = fixture.nativeElement.querySelector('[data-testid="acoes"]') as HTMLButtonElement;

    botao.click();
    fixture.detectChanges();

    expect(comp.acoes()[0].label).toBe('Ver detalhes');
  });

  it('abre o painel de detalhe pelo item do menu', () => {
    const { fixture, comp } = montar({ ativos: [ATIVO] });
    const botao = fixture.nativeElement.querySelector('[data-testid="acoes"]') as HTMLButtonElement;

    botao.click();
    fixture.detectChanges();
    comp.acoes()[0].command?.({});
    fixture.detectChanges();

    expect(comp.detalheVisivel()).toBe(true);
    expect(comp.emDetalhe()?.id).toBe('1');
  });

  it('reaproveita litros e valor social do agregado que a lista já buscou', () => {
    // O detalhe não faz chamada nova ao impacto: o endpoint por local devolve os dois números.
    const { comp } = montar({
      ativos: [ATIVO],
      litros: [{ localId: '1', localNome: ATIVO.nome, litrosReais: 1842, valorSocial: 1842 }],
    });

    comp.verDetalhes(ATIVO);

    expect(comp.litrosDoDetalhe()).toBe(1842);
    expect(comp.valorSocialDoDetalhe()).toBe(1842);
    expect(impactoFake.porLocal).toHaveBeenCalledTimes(1);
  });

  it('passa nulo ao detalhe quando o agregado de impacto está indisponível', () => {
    const { comp } = montar({ ativos: [ATIVO], litros: 'falha' });

    comp.verDetalhes(ATIVO);

    expect(comp.litrosDoDetalhe()).toBeNull();
    expect(comp.valorSocialDoDetalhe()).toBeNull();
  });

  it('passa zero ao detalhe para local sem coleta', () => {
    const { comp } = montar({ ativos: [ATIVO], litros: [] });

    comp.verDetalhes(ATIVO);

    expect(comp.litrosDoDetalhe()).toBe(0);
    expect(comp.valorSocialDoDetalhe()).toBe(0);
  });

  it('abre o formulário de edição pelo detalhe', () => {
    const { comp } = montar({ ativos: [ATIVO] });

    comp.editar(ATIVO);

    expect(comp.formVisivel()).toBe(true);
    expect(comp.emEdicao()?.id).toBe('1');
  });

  it('leva à visão geral de estações já filtrada por aquele local', () => {
    // A tela de estações por local deixou de existir (research D8): "Ver pontos" agora aponta para a
    // visão geral, semeando o filtro da coluna Local. O filtro vai por **nome** porque é ele que a
    // coluna filtra e é ele que o Gestor lê e limpa no funil — um identificador filtraria igual e
    // seria invisível na tela.
    const { comp } = montar({ ativos: [ATIVO] });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    comp.verPontos(ATIVO);

    expect(navegar).toHaveBeenCalledWith(['/pontos'], { queryParams: { local: ATIVO.nome } });
  });
});
