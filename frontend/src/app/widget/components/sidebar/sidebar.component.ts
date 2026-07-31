import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ItemNav {
  readonly label: string;
  readonly link: string;
  readonly contador?: number;
}

interface GrupoNav {
  readonly titulo: string;
  readonly itens: readonly ItemNav[];
}

/**
 * Barra lateral compartilhada do painel (rail de navegação): marca, grupos de
 * navegação com contadores, card da meta do mês e rodapé com o usuário.
 * Apenas apresentação — os dados dinâmicos entram por `input()`, com padrões que
 * reproduzem o layout de referência. Segue os tokens de `styles.scss` (docs/design.md).
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class Sidebar {
  // Contadores dos itens de operação.
  readonly locaisCount = input(18);
  readonly pontosCount = input(52);
  readonly coletasCount = input(347);

  // Meta do mês (em litros).
  readonly metaMes = input('julho');
  readonly metaAtual = input(1480);
  readonly metaTotal = input(2000);

  // Usuário autenticado exibido no rodapé.
  readonly usuarioNome = input('William Damascena');
  readonly usuarioPapel = input('Gestor');

  private readonly formatador = new Intl.NumberFormat('pt-BR');

  protected readonly grupos = computed<readonly GrupoNav[]>(() => [
    {
      titulo: 'Operação',
      itens: [
        { label: 'Painel', link: '/painel' },
        { label: 'Locais', link: '/locais', contador: this.locaisCount() },
        { label: 'Pontos de coleta', link: '/pontos', contador: this.pontosCount() },
        { label: 'Coletas', link: '/coletas', contador: this.coletasCount() },
      ],
    },
    {
      titulo: 'Transparência',
      itens: [
        { label: 'Prestação de contas', link: '/prestacao-de-contas' },
        { label: 'Ranking', link: '/ranking' },
      ],
    },
  ]);

  /** Iniciais do nome do usuário (ex.: "William Damascena" → "WD"). */
  protected readonly iniciais = computed(() => {
    const partes = this.usuarioNome().trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      return '';
    }
    const primeira = partes[0].charAt(0);
    const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : '';
    return (primeira + ultima).toUpperCase();
  });

  /** Percentual da meta atingido, limitado a 0–100. */
  protected readonly metaPct = computed(() => {
    const total = this.metaTotal();
    if (total <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((this.metaAtual() / total) * 100)));
  });

  /** O item "Painel" só fica ativo na rota exata; os demais casam por prefixo. */
  protected exato(link: string): boolean {
    return link === '/painel';
  }

  protected formatar(valor: number): string {
    return this.formatador.format(valor);
  }
}