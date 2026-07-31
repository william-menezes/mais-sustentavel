import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Migalha {
  readonly label: string;
  readonly link?: string;
}

/**
 * Cabeçalho compartilhado do painel: botão de menu (alterna a sidebar), trilha de
 * navegação (breadcrumb), sino de notificações e chip do usuário. Apenas
 * apresentação — dados por `input()` e ações por `output()`. Tokens de `styles.scss`.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class Header {
  /** Trilha de navegação; o último item é a página atual (sem link). */
  readonly trilha = input<readonly Migalha[]>([{ label: 'Home', link: '/' }, { label: 'Painel' }]);
  readonly usuarioNome = input('William Damascena');

  /** Clique no botão de menu (para alternar a sidebar no layout hospedeiro). */
  readonly menuAlternado = output<void>();
  /** Clique no sino de notificações. */
  readonly notificacoes = output<void>();
  /** Clique no chip do usuário (abrir menu de perfil). */
  readonly perfil = output<void>();

  /** Inicial do usuário para o avatar (ex.: "William Damascena" → "W"). */
  protected readonly inicial = computed(() => {
    const nome = this.usuarioNome().trim();
    return nome ? nome.charAt(0).toUpperCase() : '';
  });
}
