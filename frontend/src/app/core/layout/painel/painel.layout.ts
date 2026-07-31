import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '@widget/components/header/header.component';
import { Sidebar } from '@widget/components/sidebar/sidebar.component';

/**
 * Casca do painel administrativo: a {@link Sidebar} à esquerda e a coluna principal
 * (o {@link Header} no topo + área de conteúdo). As páginas dos domínios entram no
 * `<router-outlet>` como rotas filhas, então a chrome não é repetida em cada tela.
 */
@Component({
  selector: 'app-painel-layout',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './painel.layout.html',
  styleUrl: './painel.layout.scss',
})
export class PainelLayout {}
