import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';

import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  /**
   * O jsdom não implementa `matchMedia`, então cada caso instala o seu. Devolve um gatilho para
   * simular a mudança de viewport sem depender de layout real.
   */
  function instalarMatchMedia(inicial: boolean) {
    const ouvintes: ((evento: MediaQueryListEvent) => void)[] = [];
    const remover = vi.fn();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: inicial,
        addEventListener: (_: string, ouvinte: (evento: MediaQueryListEvent) => void) => ouvintes.push(ouvinte),
        removeEventListener: remover,
      }),
    );
    return {
      remover,
      mudarPara: (matches: boolean) =>
        ouvintes.forEach((ouvinte) => ouvinte({ matches } as MediaQueryListEvent)),
    };
  }

  afterEach(() => vi.unstubAllGlobals());

  it('reflete a consulta de mídia no primeiro acesso', () => {
    instalarMatchMedia(true);
    expect(TestBed.inject(ViewportService).telaLarga()).toBe(true);
  });

  it('reflete viewport estreita', () => {
    instalarMatchMedia(false);
    expect(TestBed.inject(ViewportService).telaLarga()).toBe(false);
  });

  it('reage à mudança de viewport', () => {
    const media = instalarMatchMedia(true);
    const servico = TestBed.inject(ViewportService);

    media.mudarPara(false);

    expect(servico.telaLarga()).toBe(false);
  });

  it('assume tela larga quando matchMedia não existe', () => {
    // Ambientes sem matchMedia (jsdom sem stub) não devem derrubar nenhum componente que dependa
    // do serviço — o padrão é o layout de desktop.
    vi.stubGlobal('matchMedia', undefined);

    expect(TestBed.inject(ViewportService).telaLarga()).toBe(true);
  });

  it('consulta o breakpoint de 768 px do design system', () => {
    instalarMatchMedia(true);
    TestBed.inject(ViewportService);

    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
  });
});
