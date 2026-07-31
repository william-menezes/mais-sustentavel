import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';

import { LocalAutocomplete } from './local-autocomplete.component';
import { CepService } from '../../apis/cep.api';
import { LocalService } from '../../apis/local.api';
import { Local, TipoLocal, Uf } from '../../interfaces/local.interface';
import { LocalForm } from '../local-form/local-form.component';

/** Superfície interna lida pelos testes — os derivados são protegidos no componente. */
interface Interno {
  sugestoes: () => Local[];
  consulta: () => string;
  semResultado: () => boolean;
  erroAoCarregar: () => boolean;
  formularioVisivel: () => boolean;
  nivelDoFormulario: () => number;
  filtrar: (evento: { query: string }) => void;
  aoMudarCampo: (valor: Local | string | null) => void;
  abrirNovoLocal: () => void;
}

/** Superfície do formulário de Local que o teste preenche para concluir o cadastro empilhado. */
interface FormularioInterno {
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

const ACACIAS: Local = {
  id: 'local-1',
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
  criadoEm: '',
};

/** Bairro acentuado: é por ele que "Sao Jose" tem de encontrar "São José". */
const ESCOLA: Local = {
  ...ACACIAS,
  id: 'local-2',
  nome: 'Escola Municipal Central',
  tipo: 'ESCOLA',
  bairro: 'São José',
};

/** Nome acentuado: é por ele que "Uberlandia" tem de encontrar "Uberlândia". */
const FEIRA: Local = {
  ...ACACIAS,
  id: 'local-3',
  nome: 'Feira Uberlândia',
  tipo: 'ESPACO_PUBLICO',
  bairro: 'Centro',
};

const ARQUIVADO: Local = {
  ...ACACIAS,
  id: 'local-4',
  nome: 'Padaria do Bairro',
  arquivado: true,
};

const CRIADO: Local = {
  ...ACACIAS,
  id: 'local-9',
  nome: 'Condomínio Recém-Conquistado',
  bairro: 'Tibery',
};

describe('LocalAutocomplete', () => {
  let localFake: {
    listar: ReturnType<typeof vi.fn>;
    criar: ReturnType<typeof vi.fn>;
    editar: ReturnType<typeof vi.fn>;
  };
  let cepFake: { consultar: ReturnType<typeof vi.fn> };

  function montar(opcoes: { locais?: Local[]; falha?: boolean; nivel?: number } = {}): {
    fixture: ComponentFixture<LocalAutocomplete>;
    comp: Interno;
  } {
    const locais = opcoes.locais ?? [ACACIAS, ESCOLA, FEIRA, ARQUIVADO];
    localFake = {
      listar: vi
        .fn()
        .mockReturnValue(opcoes.falha ? throwError(() => new Error('fora')) : of(locais)),
      criar: vi.fn().mockReturnValue(of(CRIADO)),
      editar: vi.fn(),
    };
    // A consulta de CEP é do formulário empilhado. "Não encontrado" mantém o endereço que o teste
    // preenche, em vez de sobrescrevê-lo com a resposta do provedor.
    cepFake = { consultar: vi.fn().mockReturnValue(of({ situacao: 'nao-encontrado' })) };

    TestBed.configureTestingModule({
      imports: [LocalAutocomplete],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: LocalService, useValue: localFake },
        { provide: CepService, useValue: cepFake },
      ],
    });

    const fixture = TestBed.createComponent(LocalAutocomplete);
    if (opcoes.nivel !== undefined) {
      fixture.componentRef.setInput('nivel', opcoes.nivel);
    }
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  /** Nomes das sugestões, na ordem — o que a pessoa veria na lista. */
  function nomes(comp: Interno): string[] {
    return comp.sugestoes().map((local) => local.nome);
  }

  function formulario(fixture: ComponentFixture<LocalAutocomplete>): FormularioInterno {
    const encontrado = fixture.debugElement.query(By.directive(LocalForm));
    return encontrado.componentInstance as unknown as FormularioInterno;
  }

  function preencherLocal(form: FormularioInterno): void {
    form.nome.set('Condomínio Recém-Conquistado');
    form.tipo.set('CONDOMINIO');
    form.cepMascarado.set('38408-100');
    form.rua.set('Rua Nova');
    form.numero.set('10');
    form.bairro.set('Tibery');
    form.cidade.set('Uberlândia');
    form.uf.set('MG');
  }

  /**
   * Valor exibido no campo — o `p-autocomplete` publica o rótulo do escolhido no atributo.
   *
   * Espera a estabilização porque o `ngModel` propaga o valor para o controle em microtarefa: uma
   * detecção de mudanças síncrona ainda leria o campo vazio.
   */
  async function valorDoCampo(
    fixture: ComponentFixture<LocalAutocomplete>,
  ): Promise<string | null> {
    await fixture.whenStable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input.p-autocomplete-input');
    return (input as HTMLInputElement | null)?.getAttribute('value') ?? null;
  }

  // ---------- carga do acervo ----------

  it('carrega os locais uma única vez, mesmo com várias buscas', () => {
    // Dezenas de locais cabem na memória; consulta por tecla seria latência sem ganho (D7).
    const { comp } = montar();

    comp.filtrar({ query: 'jar' });
    comp.filtrar({ query: 'jard' });
    comp.filtrar({ query: 'jardim' });

    expect(localFake.listar).toHaveBeenCalledTimes(1);
  });

  it('não consulta o servidor antes de o campo ser usado', () => {
    // Painel fechado ainda instancia o conteúdo projetado: carregar na criação faria toda tela que
    // hospeda o cadastro de estação pedir a lista de locais só por existir.
    montar();

    expect(localFake.listar).not.toHaveBeenCalled();
  });

  it('não oferece locais arquivados', () => {
    // Local arquivado não recebe estação nova: oferecê-lo produziria recusa do servidor (FR-021).
    const { comp } = montar();

    comp.filtrar({ query: 'padaria' });

    expect(nomes(comp)).toEqual([]);
    expect(comp.sugestoes().some((local) => local.arquivado)).toBe(false);
  });

  it('avisa quando não consegue carregar os locais, sem travar o campo', () => {
    const { fixture, comp } = montar({ falha: true });

    comp.filtrar({ query: 'jardim' });
    fixture.detectChanges();

    expect(comp.erroAoCarregar()).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="erro-locais"]')).toBeTruthy();
  });

  // ---------- filtro ----------

  it('filtra por nome', () => {
    const { comp } = montar();

    comp.filtrar({ query: 'escola' });

    expect(nomes(comp)).toEqual(['Escola Municipal Central']);
  });

  it('filtra por bairro', () => {
    const { comp } = montar();

    comp.filtrar({ query: 'centro' });

    expect(nomes(comp)).toEqual(['Feira Uberlândia']);
  });

  it('ignora acentos e caixa na busca por nome', () => {
    // Quem digita rápido não acentua: "Uberlandia" tem de encontrar "Uberlândia" (D7).
    const { comp } = montar();

    comp.filtrar({ query: 'UBERLANDIA' });

    expect(nomes(comp)).toEqual(['Feira Uberlândia']);
  });

  it('ignora acentos na busca por bairro', () => {
    const { comp } = montar();

    comp.filtrar({ query: 'sao jose' });

    expect(nomes(comp)).toEqual(['Escola Municipal Central']);
  });

  it('oferece todos os ativos quando a busca vem vazia', () => {
    const { comp } = montar();

    comp.filtrar({ query: '' });

    expect(nomes(comp)).toEqual([
      'Condomínio Jardim das Acácias',
      'Escola Municipal Central',
      'Feira Uberlândia',
    ]);
  });

  // ---------- escolha ----------

  it('escolhe o local selecionado na lista', async () => {
    const { fixture, comp } = montar();

    comp.aoMudarCampo(ESCOLA);
    fixture.detectChanges();

    expect(fixture.componentInstance.local()).toEqual(ESCOLA);
    expect(await valorDoCampo(fixture)).toBe('Escola Municipal Central');
  });

  it('deixa de ter local escolhido quando o texto do campo muda', () => {
    // Texto solto não é local: enquanto se digita outra busca, o formulário volta a estar pendente.
    const { fixture, comp } = montar();
    comp.aoMudarCampo(ESCOLA);

    comp.aoMudarCampo('escol');

    expect(fixture.componentInstance.local()).toBeNull();
  });

  it('exibe no campo o local escolhido por fora, sem esperar digitação', async () => {
    // É o caso do local pré-selecionado e o do local recém-criado no formulário empilhado.
    const { fixture } = montar();

    fixture.componentRef.setInput('local', ACACIAS);
    fixture.detectChanges();

    expect(await valorDoCampo(fixture)).toBe('Condomínio Jardim das Acácias');
  });

  // ---------- estado sem resultado (US5) ----------

  it('oferece cadastrar o local quando a busca não encontra nada', () => {
    const { fixture, comp } = montar();

    comp.filtrar({ query: 'Condomínio Inexistente' });
    fixture.detectChanges();

    expect(comp.semResultado()).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-testid="sem-resultado"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="adicionar-local"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent as string).toContain('Condomínio Inexistente');
  });

  it('não oferece cadastro antes de qualquer busca', () => {
    const { fixture, comp } = montar();

    expect(comp.semResultado()).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-testid="adicionar-local"]')).toBeFalsy();
  });

  it('abre o formulário de Local ao acionar a oferta', () => {
    const { fixture, comp } = montar();
    comp.filtrar({ query: 'Condomínio Inexistente' });
    fixture.detectChanges();
    expect(document.querySelectorAll('.p-drawer').length).toBe(0);

    (
      fixture.nativeElement.querySelector('[data-testid="adicionar-local"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(comp.formularioVisivel()).toBe(true);
    expect(document.querySelectorAll('.p-drawer').length).toBe(1);
    expect(fixture.debugElement.query(By.directive(LocalForm))).toBeTruthy();
  });

  it('abre o formulário um nível acima do painel que hospeda o campo', () => {
    // FR-043: empilhado sobre o cadastro da estação, não no lugar dele.
    const { comp } = montar({ nivel: 1 });

    expect(comp.nivelDoFormulario()).toBe(2);
  });

  it('faz o nível chegar até o painel, e não apenas ser calculado', async () => {
    // A distinção é o defeito que este teste existe para pegar: por um tempo o nível era calculado
    // corretamente aqui e **não era repassado** ao `app-local-form`, que entregava o padrão 0 ao painel
    // compartilhado. Os dois painéis saíam com a mesma largura e se sobrepunham exatamente — FR-044
    // quebrado, com o computed certo. Asserção sobre o computed passava; esta não.
    const { fixture, comp } = montar({ nivel: 1 });
    comp.abrirNovoLocal();
    fixture.detectChanges();
    await fixture.whenStable();

    const painelDeCima = fixture.debugElement
      .query(By.directive(LocalForm))
      .query(By.directive(FormDrawer)).componentInstance as { nivel: () => number };

    expect(painelDeCima.nivel()).toBe(2);
  });

  it('devolve o local criado escolhido no campo e fecha o formulário', async () => {
    const { fixture, comp } = montar();
    comp.filtrar({ query: 'Condomínio Recém' });
    comp.abrirNovoLocal();
    fixture.detectChanges();

    const form = formulario(fixture);
    preencherLocal(form);
    form.salvar();
    fixture.detectChanges();

    expect(localFake.criar).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.local()).toEqual(CRIADO);
    expect(comp.formularioVisivel()).toBe(false);
    expect(await valorDoCampo(fixture)).toBe('Condomínio Recém-Conquistado');
  });

  it('passa a encontrar o local criado nas buscas seguintes', () => {
    // Ele entra no acervo já carregado; buscá-lo de novo no servidor seria consulta repetida.
    const { fixture, comp } = montar();
    comp.abrirNovoLocal();
    fixture.detectChanges();
    const form = formulario(fixture);
    preencherLocal(form);
    form.salvar();
    fixture.detectChanges();

    comp.filtrar({ query: 'tibery' });

    expect(nomes(comp)).toEqual(['Condomínio Recém-Conquistado']);
    expect(localFake.listar).toHaveBeenCalledTimes(1);
  });

  it('não cria local nenhum ao cancelar, e devolve o campo como estava', () => {
    const { fixture, comp } = montar();
    comp.filtrar({ query: 'Condomínio Inexistente' });
    comp.abrirNovoLocal();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-testid="cancelar"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(localFake.criar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.local()).toBeNull();
    expect(comp.formularioVisivel()).toBe(false);
    expect(document.querySelectorAll('.p-drawer').length).toBe(0);
  });
});
