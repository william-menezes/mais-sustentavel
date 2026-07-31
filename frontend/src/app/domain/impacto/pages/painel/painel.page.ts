import { Component } from '@angular/core';

/**
 * Painel de impacto: visão geral da operação. Renderiza dentro do PainelLayout
 * (`core/layout/painel`), que fornece a sidebar e o header. O conteúdo do dashboard
 * — valor social agregado, servido por /api/impacto — entra na IS-02.
 */
@Component({
  selector: 'app-painel',
  templateUrl: './painel.page.html',
  styleUrl: './painel.page.scss',
})
export class Painel {}
