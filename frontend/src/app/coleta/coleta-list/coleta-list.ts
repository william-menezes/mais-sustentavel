import { Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ColetaService } from '../coleta.service';
import { Coleta } from '../coleta.model';
import { ColetaForm } from '../coleta-form/coleta-form';

/**
 * Coletas de um ponto (`/pontos/:pontoId/coletas`): total de litros recolhidos, lista
 * das coletas e registro de novas coletas (diálogo).
 */
@Component({
  selector: 'app-coleta-list',
  imports: [TableModule, ButtonModule, ToastModule, ColetaForm],
  providers: [MessageService],
  templateUrl: './coleta-list.html',
  styleUrl: './coleta-list.scss',
})
export class ColetaList implements OnInit {
  private readonly service = inject(ColetaService);
  private readonly mensagens = inject(MessageService);
  private readonly rota = inject(ActivatedRoute);
  private readonly navegacao = inject(Location);

  protected readonly pontoId = this.rota.snapshot.paramMap.get('pontoId') ?? '';
  protected readonly coletas = signal<Coleta[]>([]);
  protected readonly total = signal(0);
  protected readonly carregando = signal(false);
  protected readonly formVisivel = signal(false);

  ngOnInit(): void {
    this.carregar();
  }

  /** Formata 'YYYY-MM-DD' em 'DD/MM/AAAA' sem passar por Date (evita fuso). */
  protected dataBr(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.pontoId).subscribe({
      next: (dados) => {
        this.coletas.set(dados.coletas);
        this.total.set(dados.totalLitros);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.mensagens.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as coletas.' });
      },
    });
  }

  protected novaColeta(): void {
    this.formVisivel.set(true);
  }

  protected aoRegistrar(): void {
    this.mensagens.add({ severity: 'success', summary: 'Coleta registrada', detail: 'Total atualizado.' });
    this.carregar();
  }

  protected voltar(): void {
    this.navegacao.back();
  }
}
