import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { Local } from '@domain/local/interfaces/local.interface';
import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

/**
 * Cadastro de ponto de coleta em painel sobreposto, aberto **sobre** a ficha do Local.
 *
 * <p>Um ponto não tem campo nenhum a preencher: o servidor gera o QR Code e devolve o ponto pronto
 * (ver {@link PontoService.criar}). Por isso o painel não é um formulário — é confirmação e
 * entrega. O passo depois da criação mostra o QR gerado, que é o motivo pelo qual alguém cadastra um
 * ponto: imprimir e colar no lugar onde o óleo é recolhido. Fechar sem ver o código obrigaria a
 * passar pela tela de Pontos só para buscá-lo.
 *
 * <p>Vive empilhado: o {@link FormDrawer} do Local continua aberto atrás. O `ZIndexUtils` do PrimeNG
 * incrementa a camada a cada painel modal, então o de cima recebe z-index maior sem configuração.
 */
@Component({
  selector: 'app-ponto-form',
  imports: [FormDrawer, ButtonModule],
  templateUrl: './ponto-form.component.html',
  styleUrl: './ponto-form.component.scss',
})
export class PontoForm {
  private readonly service = inject(PontoService);
  private readonly mensagens = inject(MessageService);

  /** Visibilidade do painel (two-way com quem hospeda). */
  readonly visivel = model<boolean>(false);
  /** Local que recebe o ponto; `null` mantém o painel sem conteúdo. */
  readonly local = input<Local | null>(null);

  /** Emitido depois de criar, para quem hospeda recarregar a lista de pontos. */
  readonly criado = output<Ponto>();

  protected readonly criando = signal(false);
  /** Ponto recém-criado. Enquanto `null`, o painel está no passo de confirmação. */
  protected readonly novoPonto = signal<Ponto | null>(null);

  /**
   * Local arquivado não aceita ponto novo — a API recusa. Barrar aqui evita oferecer uma ação que
   * só poderia terminar em erro, e diz o motivo em vez de deixar o Gestor descobrir pelo toast.
   */
  protected readonly arquivado = computed(() => this.local()?.arquivado ?? false);

  protected readonly trilha = computed<MenuItem[]>(() => [
    { label: 'Home' },
    { label: 'Locais' },
    { label: this.local()?.nome ?? '' },
    { label: 'Novo ponto' },
  ]);

  /** Referência curta do ponto criado — a mesma abreviação de oito caracteres da tela de Pontos. */
  protected readonly referencia = computed(() => this.novoPonto()?.id.slice(0, 8) ?? '');

  protected readonly urlDoQr = computed(() => {
    const ponto = this.novoPonto();
    return ponto ? this.service.qrUrl(ponto.id) : '';
  });

  protected criar(): void {
    const alvo = this.local();
    if (!alvo || this.arquivado() || this.criando()) {
      return;
    }
    this.criando.set(true);
    this.service.criar(alvo.id).subscribe({
      next: (ponto) => {
        this.criando.set(false);
        this.novoPonto.set(ponto);
        this.mensagens.add({
          severity: 'success',
          summary: 'Ponto criado',
          detail: 'QR Code gerado para este local.',
        });
        // Avisa agora, não no fechar: a ficha atrás já mostra o ponto novo enquanto o QR está à vista.
        this.criado.emit(ponto);
      },
      error: () => {
        this.criando.set(false);
        this.mensagens.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível criar o ponto de coleta.',
        });
      },
    });
  }

  protected baixarQr(): void {
    const ponto = this.novoPonto();
    if (!ponto) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.service.qrUrl(ponto.id);
    link.download = `qr-${this.referencia()}.png`;
    link.click();
  }

  protected fechar(): void {
    this.visivel.set(false);
    // Zera o passo para que a próxima abertura comece na confirmação, e não no QR anterior.
    this.novoPonto.set(null);
  }
}
