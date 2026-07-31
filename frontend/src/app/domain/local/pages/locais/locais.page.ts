import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  FilterMatchMode,
  FilterMetadata,
  FilterOperator,
  MenuItem,
  MessageService,
} from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { catchError, forkJoin, of } from 'rxjs';

import { ImpactoService } from '@domain/impacto/apis/impacto.api';
import { ValorSocialLocal } from '@domain/impacto/interfaces/impacto.interface';
import { LocalService } from '../../apis/local.api';
import { LocalDetalhe } from '../../components/local-detalhe/local-detalhe.component';
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
    LocalDetalhe,
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

  /**
   * Estado inicial dos filtros de coluna, **declarado** em vez de aplicado por código.
   *
   * <p>A forma importa. Com `filterDisplay="menu"` o PrimeNG guarda um **array de condições** por
   * campo — é o que o `initFieldFilterConstraint` dele cria — e o painel do funil percorre esse
   * array com `@for`. A API `tabela.filter(valor, campo, modo)`, que a própria biblioteca chama de
   * *legacy* num comentário do `hasFilter`, grava a forma de **linha**: um objeto único. Além
   * disso, o `effect` que sincroniza o input `filters` roda depois e substitui o mapa inteiro, de
   * modo que o valor aplicado por código simplesmente desaparecia: a tabela ficava filtrada
   * enquanto o funil e o menu diziam que não havia filtro nenhum.
   *
   * <p>Todas as colunas filtráveis estão aqui, não só `situacao`: o binding troca o mapa inteiro, e
   * uma coluna ausente perderia a condição que o PrimeNG cria sozinho — abrindo o painel vazio.
   */
  protected readonly filtrosIniciais: Record<string, FilterMetadata[]> = {
    nome: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH, operator: FilterOperator.AND }],
    tipo: [{ value: null, matchMode: FilterMatchMode.EQUALS, operator: FilterOperator.AND }],
    litros: [{ value: null, matchMode: FilterMatchMode.EQUALS, operator: FilterOperator.AND }],
    // Já chega em "ativo" (FR-018 / RN-G-06), sem abrir exceção na regra de filtro por coluna.
    situacao: [{ value: 'ATIVO', matchMode: FilterMatchMode.EQUALS, operator: FilterOperator.AND }],
  };

  protected readonly locais = signal<Local[]>([]);
  /**
   * Agregado de impacto indexado por local, guardado inteiro (litros e valor social) porque o
   * endpoint devolve os dois de uma vez — assim o painel de detalhe recebe ambos por input em vez
   * de repetir a chamada. `null` quando o agregado falhou, distinto de um mapa vazio.
   */
  protected readonly impactoPorLocal = signal<Map<string, ValorSocialLocal> | null>(null);
  protected readonly carregando = signal(false);
  protected readonly formVisivel = signal(false);
  protected readonly emEdicao = signal<Local | null>(null);
  protected readonly acoes = signal<MenuItem[]>([]);
  protected readonly detalheVisivel = signal(false);
  protected readonly emDetalhe = signal<Local | null>(null);

  protected readonly rotuloTipo = rotuloTipo;
  protected readonly opcoesTipo = TIPOS_LOCAL;
  protected readonly opcoesSituacao = [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Arquivado', value: 'ARQUIVADO' },
  ];

  /** Linhas da tabela: o Local mais os derivados que o filtro de coluna precisa como campo. */
  protected readonly linhas = computed<LocalNaLista[]>(() => {
    const mapa = this.impactoPorLocal();
    return this.locais().map((local) => ({
      ...local,
      situacao: local.arquivado ? ('ARQUIVADO' as const) : ('ATIVO' as const),
      litros: mapa ? (mapa.get(local.id)?.litrosReais ?? 0) : null,
    }));
  });

  /**
   * Litros e valor social do local em detalhe, tirados do mesmo mapa da lista. `null` quando o
   * agregado está indisponível; `0` quando o local está no acervo mas não teve coleta.
   */
  protected readonly litrosDoDetalhe = computed(() => this.doAgregado((v) => v.litrosReais));
  protected readonly valorSocialDoDetalhe = computed(() => this.doAgregado((v) => v.valorSocial));

  ngOnInit(): void {
    this.carregar();
  }

  /**
   * Pede a filtragem do estado declarado em {@link filtrosIniciais}. O binding entrega os valores à
   * tabela, mas não dispara a filtragem sozinho — e só a partir daqui o `viewChild` existe.
   */
  ngAfterViewInit(): void {
    this.tabela()?._filter();
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
   * Um número do agregado para o local em detalhe. Método compartilhado pelos dois computeds
   * porque a distinção entre "não veio" e "não recolheu" é a mesma para litros e valor social.
   */
  private doAgregado(extrair: (valor: ValorSocialLocal) => number): number | null {
    const mapa = this.impactoPorLocal();
    const alvo = this.emDetalhe();
    if (!mapa || !alvo) {
      return null;
    }
    const entrada = mapa.get(alvo.id);
    // Ausente do agregado significa nenhuma coleta registrada — aqui zero é o dado correto.
    return entrada ? extrair(entrada) : 0;
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
        this.impactoPorLocal.set(
          litros ? new Map(litros.map((valor) => [valor.localId, valor])) : null,
        );
        this.carregando.set(false);
        if (litros === null) {
          this.mensagens.add({
            severity: 'warn',
            summary: 'Litros indisponíveis',
            detail: 'Não foi possível consultar o volume por local.',
          });
        }
        // Reaplica sobre o conjunto novo: recarregar depois de arquivar não deve mostrar de volta
        // o que o filtro do Gestor exclui.
        this.tabela()?._filter();
      },
      error: () => {
        this.carregando.set(false);
        this.notificarErro('Não foi possível carregar os locais.');
      },
    });
  }

  protected limparFiltros(): void {
    this.tabela()?.clear();
  }

  protected abrirAcoes(evento: Event, linha: LocalNaLista): void {
    this.acoes.set([
      { label: 'Ver detalhes', command: () => this.verDetalhes(linha) },
      { label: 'Ver pontos', command: () => this.verPontos(linha) },
      { label: 'Editar', command: () => this.editar(linha) },
      linha.arquivado
        ? { label: 'Reativar', command: () => this.reativar(linha) }
        : { label: 'Arquivar', command: () => this.arquivar(linha) },
    ]);
    this.menuAcoes()?.toggle(evento);
  }

  protected verDetalhes(local: Local): void {
    this.emDetalhe.set(local);
    this.detalheVisivel.set(true);
  }

  protected verPontos(local: Local): void {
    void this.router.navigate(['/locais', local.id, 'pontos']);
  }

  /** O cadastro de ponto acontece na tela de Pontos do local — é para lá que o detalhe manda. */
  protected aoNovoPonto(local: Local): void {
    this.verPontos(local);
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
