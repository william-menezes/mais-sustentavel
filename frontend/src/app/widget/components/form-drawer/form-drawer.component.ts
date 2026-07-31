import { Component, computed, inject, input, model, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';

import { ViewportService } from '@shared/services/viewport/viewport.service';

/**
 * Painel sobreposto: à direita no desktop, subindo de baixo em tela estreita, com trilha de
 * navegação e título no cabeçalho e as ações no rodapé — ambos fora da área que rola.
 *
 * <p>Vive em `widget/` porque não conhece domínio nenhum: o corpo entra por `<ng-content>` e quem
 * hospeda decide quando salvar está disponível. É o mesmo painel que as telas de Pontos e Coletas
 * vão reaproveitar, inclusive empilhado sobre outro.
 *
 * <p>Serve formulário e leitura: sem rodapé projetado ele mantém Cancelar/Salvar; com um
 * `<div acoes>` o hospedeiro põe as ações que quiser (e aí `closable` costuma fazer sentido, já
 * que não há mais um Cancelar para fechar o painel).
 */
@Component({
  selector: 'app-form-drawer',
  imports: [DrawerModule, BreadcrumbModule, ButtonModule],
  templateUrl: './form-drawer.component.html',
  styleUrl: './form-drawer.component.scss',
})
export class FormDrawer {
  private readonly viewport = inject(ViewportService);

  /** Visibilidade do painel (two-way com quem hospeda). */
  readonly visivel = model<boolean>(false);
  readonly titulo = input.required<string>();
  /** Trilha exibida acima do título; o último item é a página atual. */
  readonly trilha = input<MenuItem[]>([]);
  /** Mantém salvar indisponível enquanto o formulário do pai estiver incompleto (FR-025). */
  readonly salvarDesabilitado = input(false);
  readonly salvando = input(false);
  readonly rotuloSalvar = input('Salvar');
  /**
   * Exibe o X de fechar no cabeçalho. Fica desligado por padrão porque, no formulário, fechar é
   * papel do Cancelar do rodapé — um X solto descartaria um formulário preenchido sem aviso.
   */
  readonly closable = input(false);

  readonly salvar = output<void>();
  readonly cancelar = output<void>();

  /** Direita a partir de 768 px; de baixo para cima abaixo disso (FR-024). */
  protected readonly posicao = computed<'right' | 'bottom'>(() =>
    this.viewport.telaLarga() ? 'right' : 'bottom',
  );

  /**
   * Dimensão pelo binding `[style]` em vez de classe: o `p-drawer` monta o próprio DOM, então
   * estilo com encapsulamento do componente não alcançaria o container — e este projeto não tem
   * utilitários globais de largura.
   */
  protected readonly dimensao = computed<Record<string, string>>(() => {
    // Montado passo a passo em vez de dois literais num ternário: a inferência da união marcaria
    // as propriedades ausentes de cada ramo como `undefined`, o que não satisfaz Record<string, string>.
    const estilo: Record<string, string> = {};
    if (this.viewport.telaLarga()) {
      estilo['width'] = '34rem';
    } else {
      estilo['height'] = 'auto';
      estilo['max-height'] = '92dvh';
    }
    return estilo;
  });

  protected aoCancelar(): void {
    this.visivel.set(false);
    this.cancelar.emit();
  }
}
