import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class Home {
  protected readonly title = signal('+ Sustentável');
  protected readonly tagline = signal('Cada litro soma.');
}
