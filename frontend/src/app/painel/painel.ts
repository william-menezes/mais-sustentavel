import { Component } from '@angular/core';
import { Header } from '../shared/header/header';
import { Sidebar } from '../shared/sidebar/sidebar';

/**
 * Casca do painel administrativo: a {@link Sidebar} à esquerda e a coluna principal
 * (o {@link Header} no topo + área de conteúdo). Por ora só hospeda os componentes
 * compartilhados; o conteúdo do dashboard entra na IS-02.
 */
@Component({
  selector: 'app-painel',
  imports: [Sidebar, Header],
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
})
export class Painel {}
