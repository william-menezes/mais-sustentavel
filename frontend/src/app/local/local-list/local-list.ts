import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { LocalService } from '../local.service';
import { Local, rotuloTipo } from '../local.model';
import { LocalForm } from '../local-form/local-form';

/**
 * Página de Locais: listagem (ativos por padrão, com alternância para arquivados),
 * cadastro/edição em diálogo e ações de arquivar/reativar (soft delete).
 */
@Component({
  selector: 'app-local-list',
  imports: [FormsModule, TableModule, ButtonModule, TagModule, SelectButtonModule, ToastModule, LocalForm],
  providers: [MessageService],
  templateUrl: './local-list.html',
  styleUrl: './local-list.scss',
})
export class LocalList implements OnInit {
  private readonly service = inject(LocalService);
  private readonly mensagens = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly locais = signal<Local[]>([]);
  protected readonly carregando = signal(false);
  protected readonly verArquivados = signal(false);
  protected readonly formVisivel = signal(false);
  protected readonly emEdicao = signal<Local | null>(null);

  protected readonly opcoesVisao = [
    { label: 'Ativos', value: false },
    { label: 'Arquivados', value: true },
  ];
  protected readonly rotuloTipo = rotuloTipo;

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.service.listar(this.verArquivados()).subscribe({
      next: (locais) => {
        this.locais.set(locais);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.notificarErro('Não foi possível carregar os locais.');
      },
    });
  }

  protected mudarVisao(arquivados: boolean): void {
    this.verArquivados.set(arquivados);
    this.carregar();
  }

  protected verPontos(local: Local): void {
    void this.router.navigate(['/locais', local.id, 'pontos']);
  }

  protected novo(): void {
    this.emEdicao.set(null);
    this.formVisivel.set(true);
  }

  protected editar(local: Local): void {
    this.emEdicao.set(local);
    this.formVisivel.set(true);
  }

  protected aoSalvar(local: Local): void {
    this.mensagens.add({ severity: 'success', summary: 'Salvo', detail: `Local "${local.nome}" salvo.` });
    this.carregar();
  }

  protected arquivar(local: Local): void {
    this.service.arquivar(local.id).subscribe({
      next: () => {
        this.mensagens.add({ severity: 'success', summary: 'Arquivado', detail: `"${local.nome}" saiu da lista ativa.` });
        this.carregar();
      },
      error: () => this.notificarErro('Não foi possível arquivar o local.'),
    });
  }

  protected reativar(local: Local): void {
    this.service.reativar(local.id).subscribe({
      next: () => {
        this.mensagens.add({ severity: 'success', summary: 'Reativado', detail: `"${local.nome}" voltou para os ativos.` });
        this.carregar();
      },
      error: () => this.notificarErro('Não foi possível reativar o local.'),
    });
  }

  private notificarErro(detalhe: string): void {
    this.mensagens.add({ severity: 'error', summary: 'Erro', detail: detalhe });
  }
}
