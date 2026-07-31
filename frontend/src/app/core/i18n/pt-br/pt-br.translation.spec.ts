import { TestBed } from '@angular/core/testing';
import { PrimeNG } from 'primeng/config';

import { TRADUCAO_PT_BR } from './pt-br.translation';

/**
 * Estes testes comparam a tradução com o padrão **da versão do PrimeNG instalada**, lido do próprio
 * serviço de configuração. Não há lista de chaves digitada à mão aqui: quando uma atualização da
 * biblioteca acrescentar um rótulo, o teste falha apontando exatamente qual — em vez de o rótulo
 * novo aparecer em inglês na tela (ou, no caso de `aria`, virar `undefined` no leitor de tela).
 */
describe('TRADUCAO_PT_BR', () => {
  let padrao: Record<string, unknown>;
  let padraoAria: Record<string, unknown>;

  /**
   * Chaves cujo valor traduzido é **igual** ao inglês de propósito: sigla internacional, marcador
   * que o componente substitui, ou palavra usada como está em pt-BR. Sem esta lista, o teste de
   * "nada ficou em inglês" acusaria falso positivo nelas.
   */
  const IGUAIS_AO_INGLES = new Set(['am', 'pm', 'fileSizeTypes']);
  const ARIA_IGUAIS_AO_INGLES = new Set(['pageLabel', 'slideNumber', 'slide']);

  beforeEach(() => {
    // Sem `providePrimeNG`: o serviço é `providedIn: 'root'` e, sem configuração aplicada,
    // `translation` guarda exatamente o padrão em inglês da versão instalada.
    TestBed.configureTestingModule({});
    const config = TestBed.inject(PrimeNG) as unknown as { translation: Record<string, unknown> };
    padrao = config.translation;
    padraoAria = padrao['aria'] as Record<string, unknown>;
  });

  function nosso(): Record<string, unknown> {
    return TRADUCAO_PT_BR as unknown as Record<string, unknown>;
  }

  function nossoAria(): Record<string, unknown> {
    return TRADUCAO_PT_BR.aria as unknown as Record<string, unknown>;
  }

  it('cobre todas as chaves de topo do padrão da versão instalada', () => {
    const faltando = Object.keys(padrao).filter((chave) => !(chave in nosso()));

    expect(faltando).toEqual([]);
  });

  it('cobre todos os rótulos de acessibilidade do padrão', () => {
    // A mais importante das guardas: o merge do PrimeNG é raso, então este objeto substitui o dele
    // por inteiro e qualquer chave ausente vira `undefined` para quem usa leitor de tela.
    const faltando = Object.keys(padraoAria).filter((chave) => !(chave in nossoAria()));

    expect(faltando).toEqual([]);
  });

  it('não inventa chave que o PrimeNG não conhece', () => {
    // Chave a mais é rótulo que nunca vai aparecer — sintoma de erro de digitação.
    const sobrando = Object.keys(nosso()).filter((chave) => !(chave in padrao));
    const sobrandoAria = Object.keys(nossoAria()).filter((chave) => !(chave in padraoAria));

    expect(sobrando).toEqual([]);
    expect(sobrandoAria).toEqual([]);
  });

  it('não deixa nenhum rótulo de topo em inglês', () => {
    const emIngles = Object.keys(padrao)
      .filter((chave) => chave !== 'aria' && !IGUAIS_AO_INGLES.has(chave))
      .filter((chave) => mesmoValor(padrao[chave], nosso()[chave]));

    expect(emIngles).toEqual([]);
  });

  it('não deixa nenhum rótulo de acessibilidade em inglês', () => {
    const emIngles = Object.keys(padraoAria)
      .filter((chave) => !ARIA_IGUAIS_AO_INGLES.has(chave))
      .filter((chave) => mesmoValor(padraoAria[chave], nossoAria()[chave]));

    expect(emIngles).toEqual([]);
  });

  it('escreve a data na ordem brasileira', () => {
    // O padrão é `mm/dd/yy`: 03/07 seria lido como 3 de julho por quem preenche, e 7 de março pelo
    // componente. Trocar a ordem é o ponto do arquivo, não detalhe cosmético.
    expect(TRADUCAO_PT_BR.dateFormat).toBe('dd/mm/yy');
    expect(TRADUCAO_PT_BR.firstDayOfWeek).toBe(0);
  });

  it('preserva os marcadores que o componente substitui', () => {
    // `searchMessage` e `selectionMessage` passam por `replaceAll('{0}', …)`; sem o marcador o
    // número simplesmente não é anunciado.
    expect(TRADUCAO_PT_BR.searchMessage).toContain('{0}');
    expect(TRADUCAO_PT_BR.selectionMessage).toContain('{0}');
    expect(TRADUCAO_PT_BR.aria?.stars).toContain('{star}');
    expect(TRADUCAO_PT_BR.aria?.pageLabel).toContain('{page}');
  });

  /** Compara valores de tipos diferentes (texto, lista, número) por igualdade de conteúdo. */
  function mesmoValor(esperado: unknown, atual: unknown): boolean {
    if (typeof esperado === 'number') {
      // `firstDayOfWeek` é número: coincidir com o padrão não indica falta de tradução.
      return false;
    }
    return JSON.stringify(esperado) === JSON.stringify(atual);
  }
});

/**
 * O bloco acima confere o **conteúdo** do arquivo. Este confere o **efeito** de aplicá-lo pelo
 * caminho que o `providePrimeNG` usa (`setConfig` → `setTranslation`), porque o risco real não está
 * em uma tradução ruim: está no merge de um nível só, que troca o objeto `aria` inteiro pelo nosso.
 */
describe('TRADUCAO_PT_BR aplicada à configuração do PrimeNG', () => {
  let config: PrimeNG;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    config = TestBed.inject(PrimeNG);
    // Mesma chamada que o inicializador do `providePrimeNG` faz no bootstrap da aplicação.
    config.setConfig({ translation: TRADUCAO_PT_BR });
  });

  it('entrega os rótulos traduzidos pelo acessor da biblioteca', () => {
    // Prova que as chaves estão nos lugares que o PrimeNG realmente lê, não só que existem.
    expect(config.getTranslation('apply')).toBe('Aplicar');
    expect(config.getTranslation('clear')).toBe('Limpar');
    expect(config.getTranslation('emptyMessage')).toBe('Nenhum resultado encontrado');
  });

  it('não deixa nenhum rótulo indefinido depois do merge', () => {
    const traducao = (config as unknown as { translation: Record<string, unknown> }).translation;
    const indefinidas = Object.keys(traducao).filter((chave) => traducao[chave] === undefined);

    expect(indefinidas).toEqual([]);
  });

  it('não perde rótulo de acessibilidade ao substituir o objeto aria', () => {
    // A falha que este teste existe para pegar: `aria` parcial apaga o resto e o leitor de tela
    // passa a anunciar `undefined`. Some da tela sem deixar rastro — só um teste pega.
    const traducao = (config as unknown as { translation: { aria: Record<string, unknown> } })
      .translation;
    const indefinidas = Object.keys(traducao.aria).filter(
      (chave) => traducao.aria[chave] === undefined,
    );

    expect(indefinidas).toEqual([]);
    expect(traducao.aria['close']).toBe('Fechar');
    expect(traducao.aria['showFilterMenu']).toBe('Mostrar menu de filtro');
  });
});
