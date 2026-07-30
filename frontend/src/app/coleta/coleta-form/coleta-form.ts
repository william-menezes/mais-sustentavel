import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ColetaService } from '../coleta.service';

/**
 * Diálogo para registrar uma coleta num ponto: litros reais (> 0) e data (não futura).
 * Emite `registrada` para o pai atualizar a lista/total.
 */
@Component({
  selector: 'app-coleta-form',
  imports: [FormsModule, DialogModule, InputNumberModule, DatePickerModule, ButtonModule, MessageModule],
  templateUrl: './coleta-form.html',
  styleUrl: './coleta-form.scss',
})
export class ColetaForm {
  private readonly service = inject(ColetaService);

  readonly visivel = model<boolean>(false);
  readonly pontoId = input.required<string>();
  readonly registrada = output<void>();

  protected readonly hoje = new Date();
  protected readonly litros = signal<number | null>(null);
  protected readonly data = signal<Date | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly salvando = signal(false);

  constructor() {
    // Ao abrir, zera litros e propõe a data de hoje.
    effect(() => {
      if (this.visivel()) {
        this.litros.set(null);
        this.data.set(new Date());
        this.erro.set(null);
      }
    });
  }

  protected salvar(): void {
    this.erro.set(null);
    const litros = this.litros();
    const data = this.data();
    if (litros == null || litros <= 0 || !data) {
      this.erro.set('Informe os litros (maior que zero) e a data.');
      return;
    }
    this.salvando.set(true);
    this.service.registrar(this.pontoId(), { litrosReais: litros, data: this.formatar(data) }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.registrada.emit();
        this.visivel.set(false);
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível registrar. A data não pode ser futura e o ponto precisa estar ativo.');
      },
    });
  }

  protected cancelar(): void {
    this.visivel.set(false);
  }

  /** Date -> 'YYYY-MM-DD' usando os componentes locais (evita deslocamento de fuso). */
  private formatar(d: Date): string {
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }
}
