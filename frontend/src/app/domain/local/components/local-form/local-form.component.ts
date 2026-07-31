import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { LocalService } from '../../apis/local.api';
import { Local, LocalRequest, TipoLocal } from '../../interfaces/local.interface';
import { TIPOS_LOCAL } from '../../constants/tipo-local.constant';

/**
 * Diálogo de cadastro/edição de Local. Quando recebe `local`, entra em modo edição
 * (pré-preenche e faz PUT); sem ele, cadastra (POST). Emite `salvo` com o Local
 * resultante para o pai atualizar a listagem.
 */
@Component({
  selector: 'app-local-form',
  imports: [FormsModule, DialogModule, InputTextModule, SelectModule, ButtonModule, MessageModule],
  templateUrl: './local-form.component.html',
  styleUrl: './local-form.component.scss',
})
export class LocalForm {
  private readonly service = inject(LocalService);

  /** Visibilidade do diálogo (two-way com o pai). */
  readonly visivel = model<boolean>(false);
  /** Local em edição; `null` cadastra um novo. */
  readonly local = input<Local | null>(null);
  /** Emitido quando um local é salvo (criado ou editado). */
  readonly salvo = output<Local>();

  protected readonly tipos = TIPOS_LOCAL;
  protected readonly nome = signal('');
  protected readonly endereco = signal('');
  protected readonly tipo = signal<TipoLocal | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly salvando = signal(false);

  constructor() {
    // Ao abrir o diálogo, (re)preenche a partir do local em edição ou zera para novo.
    effect(() => {
      if (this.visivel()) {
        const alvo = this.local();
        this.nome.set(alvo?.nome ?? '');
        this.endereco.set(alvo?.endereco ?? '');
        this.tipo.set(alvo?.tipo ?? null);
        this.erro.set(null);
      }
    });
  }

  protected titulo(): string {
    return this.local() ? 'Editar local' : 'Novo local';
  }

  protected salvar(): void {
    this.erro.set(null);
    if (!this.nome().trim() || !this.endereco().trim() || !this.tipo()) {
      this.erro.set('Preencha nome, tipo e endereço.');
      return;
    }
    this.salvando.set(true);
    const requisicao: LocalRequest = {
      nome: this.nome().trim(),
      endereco: this.endereco().trim(),
      tipo: this.tipo(),
    };
    const alvo = this.local();
    const operacao = alvo
      ? this.service.editar(alvo.id, requisicao)
      : this.service.criar(requisicao);

    operacao.subscribe({
      next: (local) => {
        this.salvando.set(false);
        this.salvo.emit(local);
        this.visivel.set(false);
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível salvar. Verifique os dados e tente novamente.');
      },
    });
  }

  protected cancelar(): void {
    this.visivel.set(false);
  }
}
