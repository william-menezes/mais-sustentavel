import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { ViewportService } from '@shared/services/viewport/viewport.service';
import { FormDrawer } from './form-drawer.component';

/** Hospeda o painel como um pai real o usaria, com conteúdo projetado. */
@Component({
  imports: [FormDrawer],
  template: `
    <app-form-drawer
      [(visivel)]="visivel"
      titulo="Novo local"
      [trilha]="[{ label: 'Home' }, { label: 'Locais' }, { label: 'Novo' }]"
      [salvarDesabilitado]="desabilitado()"
      [closable]="fechavel()"
      [nivel]="nivel()"
      [pendencia]="pendencia()"
      (salvar)="salvou = salvou + 1"
      (cancelar)="cancelou = cancelou + 1"
    >
      <p data-testid="conteudo">Formulário</p>
    </app-form-drawer>
  `,
})
class Hospedeiro {
  visivel = signal(true);
  desabilitado = signal(false);
  fechavel = signal(false);
  nivel = signal(0);
  pendencia = signal('');
  salvou = 0;
  cancelou = 0;
}

/** Hospeda o painel projetando o próprio rodapé — o caso do painel de detalhe. */
@Component({
  imports: [FormDrawer],
  template: `
    <app-form-drawer
      [(visivel)]="visivel"
      titulo="Detalhe"
      [closable]="true"
      [pendencia]="pendencia()"
    >
      <p>Detalhe</p>
      <div acoes>
        <button type="button" data-testid="acao-propria">Arquivar</button>
      </div>
    </app-form-drawer>
  `,
})
class HospedeiroComRodape {
  visivel = signal(true);
  pendencia = signal('');
}

describe('FormDrawer', () => {
  function configurar(telaLarga: boolean) {
    TestBed.configureTestingModule({
      imports: [Hospedeiro],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: ViewportService, useValue: { telaLarga: signal(telaLarga) } },
      ],
    });
    const fixture = TestBed.createComponent(Hospedeiro);
    fixture.detectChanges();
    return fixture;
  }

  function configurarComRodape() {
    TestBed.configureTestingModule({
      imports: [HospedeiroComRodape],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: ViewportService, useValue: { telaLarga: signal(true) } },
      ],
    });
    const fixture = TestBed.createComponent(HospedeiroComRodape);
    fixture.detectChanges();
    return fixture;
  }

  it('projeta o conteúdo do formulário quando visível', () => {
    const fixture = configurar(true);

    expect(fixture.nativeElement.querySelector('[data-testid="conteudo"]')).toBeTruthy();
  });

  it('abre à direita no desktop', () => {
    const fixture = configurar(true);
    const painel = fixture.debugElement.children[0].componentInstance as unknown as {
      posicao: () => string;
    };

    expect(painel.posicao()).toBe('right');
  });

  it('abre de baixo para cima em tela estreita', () => {
    const fixture = configurar(false);
    const painel = fixture.debugElement.children[0].componentInstance as unknown as {
      posicao: () => string;
    };

    expect(painel.posicao()).toBe('bottom');
  });

  it('exibe o título e a trilha no cabeçalho', () => {
    const fixture = configurar(true);
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Novo local');
    expect(texto).toContain('Locais');
  });

  it('desabilita salvar enquanto houver obrigatório pendente', () => {
    const fixture = configurar(true);
    const hospedeiro = fixture.componentInstance;

    hospedeiro.desabilitado.set(true);
    fixture.detectChanges();
    const salvar = fixture.nativeElement.querySelector('[data-testid="salvar"]') as HTMLButtonElement;

    expect(salvar.disabled).toBe(true);
  });

  it('emite salvar ao acionar o botão', () => {
    const fixture = configurar(true);
    const salvar = fixture.nativeElement.querySelector('[data-testid="salvar"]') as HTMLButtonElement;

    salvar.click();

    expect(fixture.componentInstance.salvou).toBe(1);
  });

  it('emite cancelar e fecha o painel', () => {
    const fixture = configurar(true);
    const cancelar = fixture.nativeElement.querySelector('[data-testid="cancelar"]') as HTMLButtonElement;

    cancelar.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cancelou).toBe(1);
    expect(fixture.componentInstance.visivel()).toBe(false);
  });

  it('não mostra o X de fechar por padrão', () => {
    const fixture = configurar(true);

    expect(fixture.nativeElement.querySelector('.p-drawer-close-button')).toBeFalsy();
  });

  it('mostra o X de fechar quando closable', () => {
    const fixture = configurar(true);

    fixture.componentInstance.fechavel.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.p-drawer-close-button')).toBeTruthy();
  });

  it('usa os botões padrão quando o pai não projeta rodapé', () => {
    const fixture = configurar(true);

    expect(fixture.nativeElement.querySelector('[data-testid="cancelar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="salvar"]')).toBeTruthy();
  });

  it('substitui o rodapé padrão pelo projetado', () => {
    // O painel de detalhe não salva nada: Cancelar/Salvar dariam ao usuário ações que não existem.
    const fixture = configurarComRodape();

    expect(fixture.nativeElement.querySelector('[data-testid="acao-propria"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="cancelar"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="salvar"]')).toBeFalsy();
  });

  // ---------- aviso de pendências ----------

  it('não mostra aviso de pendência quando não há o que dizer', () => {
    const fixture = configurar(true);

    expect(fixture.nativeElement.querySelector('[data-testid="pendencia"]')).toBeFalsy();
  });

  it('mostra no rodapé o que falta preencher', () => {
    const fixture = configurar(true);

    fixture.componentInstance.pendencia.set('Falta preencher: tipo, CEP.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="pendencia"]')?.textContent).toContain(
      'Falta preencher: tipo, CEP.',
    );
  });

  it('mostra o aviso também para quem projeta o próprio rodapé', () => {
    // É o motivo de o aviso ser renderizado ANTES do slot de ações, e não dentro do conteúdo de
    // reserva: dentro da reserva, só quem usa Cancelar/Salvar o teria — a ficha e o painel de ponto
    // projetam rodapé próprio e ficariam de fora.
    const fixture = configurarComRodape();

    fixture.componentInstance.pendencia.set('Escolha o local do ponto.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="pendencia"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="acao-propria"]')).toBeTruthy();
  });

  // ---------- recuo do empilhamento ----------

  function dimensaoDe(fixture: ReturnType<typeof configurar>): Record<string, string> {
    const painel = fixture.debugElement.children[0].componentInstance as unknown as {
      dimensao: () => Record<string, string>;
    };
    return painel.dimensao();
  }

  it('ocupa a largura cheia no painel de base', () => {
    const fixture = configurar(true);

    expect(dimensaoDe(fixture)['width']).toBe('34rem');
  });

  it('recua a largura no painel empilhado, revelando o de baixo', () => {
    // Ancorado à direita: encolher é o que faz aparecer a borda esquerda do painel de baixo.
    // Deslocar abriria uma fresta contra a borda da tela e pareceria painel mal posicionado.
    const fixture = configurar(true);

    fixture.componentInstance.nivel.set(1);
    fixture.detectChanges();

    expect(dimensaoDe(fixture)['width']).toBe('32.5rem');
  });

  it('acumula o recuo a cada nível da pilha', () => {
    const fixture = configurar(true);

    fixture.componentInstance.nivel.set(2);
    fixture.detectChanges();

    expect(dimensaoDe(fixture)['width']).toBe('31rem');
  });

  it('recua a altura em tela estreita, onde o painel sobe de baixo', () => {
    const fixture = configurar(false);
    expect(dimensaoDe(fixture)['max-height']).toBe('92dvh');

    fixture.componentInstance.nivel.set(1);
    fixture.detectChanges();

    // `calc` porque dvh e rem não se somam fora dele; o topo do painel de baixo é o que aparece.
    expect(dimensaoDe(fixture)['max-height']).toBe('calc(92dvh - 1.5rem)');
  });

  // Cabeçalho e rodapé fixos enquanto o corpo rola é propriedade de layout: depende de altura
  // real, que o jsdom não calcula. Aqui garantimos apenas que título, trilha e ações vivem nos
  // slots de header/footer do painel — a fixação visual é verificada no roteiro 4 do quickstart.
});
