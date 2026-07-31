import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router, provideRouter } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { MenuItem } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ImpactoService } from '@domain/impacto/apis/impacto.api';
import { ValorSocialLocal } from '@domain/impacto/interfaces/impacto.interface';
import { PontoService } from '@domain/ponto/apis/ponto.api';
import { LocalList } from './locais.page';
import { LocalService } from '../../apis/local.api';
import { Local, LocalNaLista } from '../../interfaces/local.interface';

interface Interno {
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
  aoNovoPonto: (local: Local) => void;
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
    opcoes: { ativos?: Local[]; arquivados?: Local[]; litros?: ValorSocialLocal[] | 'falha' } = {},
  ): { fixture: ComponentFixture<LocalList>; comp: Interno } {
    const ativos = opcoes.ativos ?? [];
    const arquivados = opcoes.arquivados ?? [];

    localFake = {
      listar: vi.fn().mockImplementation((arq: boolean) => of(arq ? arquivados : ativos)),
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

  it('avisa quando o filtro não casa com nenhum local carregado', () => {
    // Existe local, mas o filtro padrão (ativo) não casa com um acervo só de arquivados.
    const { fixture } = montar({ arquivados: [ARQUIVADO] });

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

  it('navega para os pontos do local ao pedir novo ponto no detalhe', () => {
    const { comp } = montar({ ativos: [ATIVO] });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    comp.aoNovoPonto(ATIVO);

    expect(navegar).toHaveBeenCalledWith(['/locais', '1', 'pontos']);
  });
});
