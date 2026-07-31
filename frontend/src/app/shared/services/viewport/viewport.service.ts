import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';

/**
 * Observa a largura da viewport como signal, para componentes decidirem layout sem duplicar
 * consulta de mídia nem ler `window` direto.
 *
 * <p>Existe como serviço em vez de código dentro do componente por causa dos testes: o jsdom não
 * implementa `matchMedia`, e sem esta camada todo spec que renderizasse um componente responsivo
 * precisaria instalar um stub global. Com o serviço, apenas quem testa responsividade o substitui.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  /**
   * 768 px é a fronteira tablet/mobile da tabela de breakpoints de `docs/design.md` — a mesma em
   * que a sidebar do painel muda de comportamento. Não confundir com os 360 px de largura mínima
   * utilizável, que é piso de usabilidade, não ponto de virada.
   */
  static readonly CONSULTA_TELA_LARGA = '(min-width: 768px)';

  private readonly destroyRef = inject(DestroyRef);
  private readonly larga = signal(true);

  /** `true` a partir de 768 px. Em ambiente sem `matchMedia`, assume desktop. */
  readonly telaLarga: Signal<boolean> = this.larga.asReadonly();

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia(ViewportService.CONSULTA_TELA_LARGA);
    this.larga.set(media.matches);

    const aoMudar = (evento: MediaQueryListEvent) => this.larga.set(evento.matches);
    media.addEventListener('change', aoMudar);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', aoMudar));
  }
}
