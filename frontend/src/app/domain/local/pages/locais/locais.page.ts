import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { catchError, forkJoin, of } from 'rxjs';

import { ImpactoService } from '@domain/impacto/apis/impacto.api';
import { LocalService } from '../../apis/local.api';
import { LocalForm } from '../../components/local-form/local-form.component';
import { TIPOS_LOCAL, rotuloTipo } from '../../constants/tipo-local.constant';
import { Local, LocalNaLista } from '../../interfaces/local.interface';

/**
 * Visão geral de Locais: ativos e arquivados na mesma lista, cada coluna com filtro próprio,
 * litros por local vindos do agregado de impacto, e cadastro/edição em painel sobreposto.
 *
 * <p>O conjunto carregado é completo (FR-017), mas o filtro de situação já chega definido em
 * "ativo" (FR-018) — é o que honra a RN-G-06 sem abrir exceção na regra de filtro por coluna, e o
 * que produz a contagem "exibidos de total".
 */
@Component({
  selector: 'app-local-list',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    MenuModule,
    ToastModule,
    LocalForm,
  ],
  providers: [MessageService],
  templateUrl: './locais.page.html',
  styleUrl: './locais.page.scss',
})
export class LocalList implements OnInit, AfterViewInit {
  private readonly service = inject(LocalService);
  private readonly impacto = inject(ImpactoService);
  private readonly mensagens = inject(MessageService);
  private readonly router = inject(Router);

  private readonly tabela = viewChild<Table>('tabela');
  private readonly menuAcoes = viewChild<Menu>('menuAcoes');
  private readonly formatador = new Intl.NumberFormat('pt-BR');
  private filtroSemeado = false;

  protected readonly locais = signal<Local[]>([]);
  /** `null` quando o agregado de impacto falhou — distinto de um mapa vazio. */
  protected readonly litrosPorLocal = signal<Map<string, number> | null>(null);
  protected readonly carregando = signal(false);
  protected readonly formVisivel = signal(false);
  protected readonly emEdicao = signal<Local | null>(null);
  protected readonly acoes = signal<MenuItem[]>([]);

  protected readonly rotuloTipo = rotuloTipo;
  protected readonly opcoesTipo = TIPOS_LOCAL;
  protected readonly opcoesSituacao = [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Arquivado', value: 'ARQUIVADO' },
  ];

  /** Linhas da tabela: o Local mais os derivados que o filtro de coluna precisa como campo. */
  protected readonly linhas = computed<LocalNaLista[]>(() => {
    const mapa = this.litrosPorLocal();
    return this.locais().map((local) => ({
      ...local,
      situacao: local.arquivado ? ('ARQUIVADO' as const) : ('ATIVO' as const),
      litros: mapa ? (mapa.get(local.id) ?? 0) : null,
    }));
  });

  ngOnInit(): void {
    this.carregar();
  }

  /**
   * Segunda tentativa de semear o filtro. Necessária porque a ordem depende do tempo de resposta:
   * com dados assíncronos o `subscribe` roda com a tabela já renderizada; com dados síncronos ele
   * roda dentro do `ngOnInit`, quando o `viewChild` ainda não existe. As duas chamadas são seguras
   * porque `filtroSemeado` só é marcado quando o filtro é de fato aplicado.
   */
  ngAfterViewInit(): void {
    this.semearFiltroDeSituacao();
  }

  /**
   * Quantidade exibida após os filtros. É método e não signal de propósito: o valor depende do
   * estado interno da tabela, que muda depois do nosso `set`. Lido a cada ciclo de detecção, está
   * sempre correto — como signal exigiria sincronizar com o ciclo de vida do componente filho.
   */
  protected exibidos(): number {
    return this.tabela()?.filteredValue?.length ?? this.linhas().length;
  }

  protected litrosFormatado(linha: LocalNaLista): string {
    return linha.litros === null ? '—' : `${this.formatador.format(linha.litros)} L`;
  }

  /**
   * Endereço em uma linha, para o subtítulo da coluna Local (FR-015).
   *
   * Os componentes são filtrados antes de juntar porque locais migrados do texto livre têm
   * apenas `rua` — sem isso o resumo terminaria em vírgula ou travessão solto.
   */
  protected enderecoResumido(local: Local): string {
    const logradouro = [local.rua, local.numero].filter(Boolean).join(', ');
    return [logradouro, local.bairro].filter(Boolean).join(' — ');
  }

  protected carregar(): void {
    this.carregando.set(true);
    forkJoin({
      ativos: this.service.listar(false),
      arquivados: this.service.listar(true),
      // A falha do impacto degrada uma coluna, não a tela: a lista de locais renderiza igual.
      litros: this.impacto.porLocal().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ ativos, arquivados, litros }) => {
        this.locais.set([...ativos, ...arquivados]);
        this.litrosPorLocal.set(
          litros ? new Map(litros.map((valor) => [valor.localId, valor.litrosReais])) : null,
        );
        this.carregando.set(false);
        if (litros === null) {
          this.mensagens.add({
            severity: 'warn',
            summary: 'Litros indisponíveis',
            detail: 'Não foi possível consultar o volume por local.',
          });
        }
        this.semearFiltroDeSituacao();
      },
      error: () => {
        this.carregando.set(false);
        this.notificarErro('Não foi possível carregar os locais.');
      },
    });
  }

  /**
   * Define o filtro inicial em "ativo" (FR-018). Só na primeira carga: recarregar depois de
   * arquivar não deve desfazer o filtro que o Gestor escolheu.
   */
  private semearFiltroDeSituacao(): void {
    const tabela = this.tabela();
    // Sem tabela ainda, não marca como semeado — o ngAfterViewInit tenta de novo.
    if (this.filtroSemeado || !tabela || this.locais().length === 0) {
      return;
    }
    this.filtroSemeado = true;
    tabela.filter('ATIVO', 'situacao', 'equals');
  }

  protected limparFiltros(): void {
    this.tabela()?.clear();
  }

  protected abrirAcoes(evento: Event, linha: LocalNaLista): void {
    this.acoes.set([
      { label: 'Ver pontos', command: () => this.verPontos(linha) },
      { label: 'Editar', command: () => this.editar(linha) },
      linha.arquivado
        ? { label: 'Reativar', command: () => this.reativar(linha) }
        : { label: 'Arquivar', command: () => this.arquivar(linha) },
    ]);
    this.menuAcoes()?.toggle(evento);
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
