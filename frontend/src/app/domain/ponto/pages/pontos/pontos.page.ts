import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

/**
 * Pontos de coleta de um Local (`/locais/:localId/pontos`): listagem (ativos/arquivados),
 * cadastro direto (o ponto não tem campos — gera o QR), exibição/download do QR e soft delete.
 */
@Component({
  selector: 'app-ponto-list',
  imports: [DatePipe, FormsModule, RouterLink, TableModule, ButtonModule, SelectButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './pontos.page.html',
  styleUrl: './pontos.page.scss',
})
export class PontoList implements OnInit {
  private readonly service = inject(PontoService);
  private readonly mensagens = inject(MessageService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly localId = this.rota.snapshot.paramMap.get('localId') ?? '';
  protected readonly pontos = signal<Ponto[]>([]);
  protected readonly carregando = signal(false);
  protected readonly criando = signal(false);
  protected readonly verArquivados = signal(false);

  protected readonly opcoesVisao = [
    { label: 'Ativos', value: false },
    { label: 'Arquivados', value: true },
  ];

  ngOnInit(): void {
    this.carregar();
  }

  protected qrUrl(id: string): string {
    return this.service.qrUrl(id);
  }

  protected ref(id: string): string {
    return id.slice(0, 8);
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.localId, this.verArquivados()).subscribe({
      next: (pontos) => {
        this.pontos.set(pontos);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.notificarErro('Não foi possível carregar os pontos.');
      },
    });
  }

  protected mudarVisao(arquivados: boolean): void {
    this.verArquivados.set(arquivados);
    this.carregar();
  }

  protected verColetas(ponto: Ponto): void {
    void this.router.navigate(['/pontos', ponto.id, 'coletas']);
  }

  protected novoPonto(): void {
    this.criando.set(true);
    this.service.criar(this.localId).subscribe({
      next: () => {
        this.criando.set(false);
        this.mensagens.add({ severity: 'success', summary: 'Ponto criado', detail: 'QR Code gerado.' });
        this.carregar();
      },
      error: () => {
        this.criando.set(false);
        this.notificarErro('Não foi possível criar o ponto. O local precisa estar ativo.');
      },
    });
  }

  protected baixarQr(ponto: Ponto): void {
    const link = document.createElement('a');
    link.href = this.service.qrUrl(ponto.id);
    link.download = `qr-${this.ref(ponto.id)}.png`;
    link.click();
  }

  protected arquivar(ponto: Ponto): void {
    this.service.arquivar(ponto.id).subscribe({
      next: () => {
        this.mensagens.add({ severity: 'success', summary: 'Arquivado', detail: 'Ponto saiu da lista ativa.' });
        this.carregar();
      },
      error: () => this.notificarErro('Não foi possível arquivar o ponto.'),
    });
  }

  protected reativar(ponto: Ponto): void {
    this.service.reativar(ponto.id).subscribe({
      next: () => {
        this.mensagens.add({ severity: 'success', summary: 'Reativado', detail: 'Ponto voltou para os ativos.' });
        this.carregar();
      },
      error: () => this.notificarErro('Não foi possível reativar o ponto.'),
    });
  }

  private notificarErro(detalhe: string): void {
    this.mensagens.add({ severity: 'error', summary: 'Erro', detail: detalhe });
  }
}
