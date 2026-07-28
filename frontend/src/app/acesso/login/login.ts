import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { MessageModule } from 'primeng/message';
import { AutenticacaoService } from '../autenticacao.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonModule, InputTextModule, InputPasswordModule, MessageModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly autenticacao = inject(AutenticacaoService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly erro = signal<string | null>(null);
  protected readonly carregando = signal(false);

  protected entrar(): void {
    this.erro.set(null);
    this.carregando.set(true);
    this.autenticacao.login(this.email(), this.senha()).subscribe({
      next: () => {
        this.carregando.set(false);
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.carregando.set(false);
        // Mensagem genérica — não revela se o e-mail existe (FR-007).
        this.erro.set('Credenciais inválidas');
      },
    });
  }
}
