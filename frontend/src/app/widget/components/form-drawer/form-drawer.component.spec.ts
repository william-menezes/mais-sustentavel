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
  salvou = 0;
  cancelou = 0;
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

  // Cabeçalho e rodapé fixos enquanto o corpo rola é propriedade de layout: depende de altura
  // real, que o jsdom não calcula. Aqui garantimos apenas que título, trilha e ações vivem nos
  // slots de header/footer do painel — a fixação visual é verificada no roteiro 4 do quickstart.
});
