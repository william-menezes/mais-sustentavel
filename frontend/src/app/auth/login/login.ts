import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { AutenticacaoService } from '../autenticacao.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputPasswordModule,
    IconFieldModule,
    InputIconModule,
    MessageModule,
  ],
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

  // Controla a máscara do campo de senha (toggle ocultar/exibir). Propriedade simples
  // porque é ligada por two-way [(mask)] do pInputPassword.
  protected mascararSenha = true;

  protected entrar(): void {
    this.erro.set(null);
    this.carregando.set(true);
    this.autenticacao.login(this.email(), this.senha()).subscribe({
      next: () => {
        this.carregando.set(false);
        // Após autenticar, vai para a área administrativa (cadastro de locais).
        void this.router.navigateByUrl('/locais');
      },
      error: () => {
        this.carregando.set(false);
        // Mensagem genérica — não revela se o e-mail existe (FR-007).
        this.erro.set('Credenciais inválidas');
      },
    });
  }
}
