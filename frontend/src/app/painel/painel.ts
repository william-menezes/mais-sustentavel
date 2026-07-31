import { Component } from '@angular/core';
import { Sidebar } from '../shared/sidebar/sidebar';

/**
 * Casca do painel administrativo: a {@link Sidebar} compartilhada à esquerda e a
 * área de conteúdo à direita. Por ora só hospeda a sidebar; o conteúdo do
 * dashboard entra na IS-02.
 */
@Component({
  selector: 'app-painel',
  imports: [Sidebar],
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
})
export class Painel {}
