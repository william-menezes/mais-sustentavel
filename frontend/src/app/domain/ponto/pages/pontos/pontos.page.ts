import { AfterViewInit, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { SelectButtonModule } from 'primeng/selectbutton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { forkJoin } from 'rxjs';

import { PontoService } from '../../apis/ponto.api';
import { PontoDetalhe } from '../../components/ponto-detalhe/ponto-detalhe.component';
import { PontoForm } from '../../components/ponto-form/ponto-form.component';
import { Ponto, PontoNaLista } from '../../interfaces/ponto.interface';

/** Como a lista é desenhada. Não é lembrada entre visitas — nada nas telas pediu memória. */
type Visao = 'cartoes' | 'tabela';

/**
 * Visão geral de estações (`/pontos`): as estações de **todos** os locais na mesma lista, com
 * contagem, filtro por coluna e alternância entre cartões e tabela.
 *
 * <p>Substitui a tela de estações por local, que existia em `locais/:localId/pontos`. Aquele caso
 * virou esta mesma tela **filtrada** pelo local, semeado no filtro da coluna a partir do parâmetro
 * de consulta da rota (research D8).
 *
 * <p>O conjunto carregado é completo — ativas e arquivadas — mas o filtro de situação já chega em
 * "ativo" (FR-007), que é o que honra a RN-G-06 sem abrir exceção na regra de filtro por coluna e o
 * que produz a contagem "exibidas de total".
 *
 * <p>Hospeda o cadastro de estação e a ficha da estação como painéis sobrepostos, sem trocar de rota
 * (FR-019, FR-027). As escritas ficam **aqui**: os painéis emitem, e é a página que trata erro,
 * avisa e recarrega a lista — nenhum dos dois conhece a listagem que precisa ser atualizada.
 */
@Component({
  selector: 'app-ponto-list',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    SelectModule,
    SelectButtonModule,
    MenuModule,
    ToastModule,
    PontoForm,
    PontoDetalhe,
  ],
  providers: [MessageService],
  templateUrl: './pontos.page.html',
  styleUrl: './pontos.page.scss',
})
export class PontoList implements OnInit, AfterViewInit {
  private readonly service = inject(PontoService);
  private readonly mensagens = inject(MessageService);
  private readonly rota = inject(ActivatedRoute);

  private readonly tabela = viewChild<Table>('tabela');
  private readonly menuAcoes = viewChild<Menu>('menuAcoes');

  /** Quantas colunas a tabela tem: o `colspan` do corpo em cartões e do estado vazio sai daqui. */
  protected readonly COLUNAS = 4;

  /**
   * Nome do local que a rota trouxe, quando a tela é aberta a partir de um Local (FR-008).
   *
   * <p>Semeia o filtro **visível** da coluna Local, e não um filtro por identificador: o Gestor lê
   * no funil o que está aplicado e consegue limpá-lo. Um filtro por `localId` funcionaria igual e
   * seria invisível — a tabela filtrada e nenhuma coluna dizendo por quê.
   *
   * <p>A chave `local` é contrato de URL compartilhado com a visão geral de Locais, que monta o
   * link. As duas pontas têm teste sobre o nome exato.
   */
  private readonly localDaConsulta = this.rota.snapshot.queryParamMap.get('local');

  /**
   * Estado inicial dos filtros de coluna, **declarado** em vez de aplicado por código.
   *
   * <p>A forma importa. Com o filtro em menu o PrimeNG guarda um **array de condições** por campo —
   * é o que o `initFieldFilterConstraint` dele cria — e o painel do funil percorre esse array com
   * `@for`. A API `tabela.filter(valor, campo, modo)` grava a forma de **linha**: um objeto único,
   * que deixa o painel sem nada para percorrer. A tabela fica corretamente filtrada enquanto o funil
   * diz que não há filtro nenhum. Foi um defeito real da 006, e trocar esta declaração por aquela
   * chamada reprova cinco testes desta tela.
   *
   * <p>Todas as colunas filtráveis estão aqui, não só `situacao`. Medido no PrimeNG 22, uma coluna
   * ausente **não** perde a condição — o `p-column-filter` a cria no próprio `onInit`, depois de o
   * effect do input `filters` ter rodado. Mas essa ordem é detalhe interno da biblioteca, e a tela
   * não deveria depender dela para o painel do funil abrir preenchido.
   */
  protected readonly filtrosIniciais: Record<string, FilterMetadata[]> = {
    localNome: [
      {
        value: this.localDaConsulta,
        matchMode: FilterMatchMode.STARTS_WITH,
        operator: FilterOperator.AND,
      },
    ],
    titulo: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH, operator: FilterOperator.AND }],
    // Já chega em "ativa" (FR-007 / RN-G-06), sem abrir exceção na regra de filtro por coluna.
    situacao: [{ value: 'ATIVO', matchMode: FilterMatchMode.EQUALS, operator: FilterOperator.AND }],
  };

  protected readonly estacoes = signal<Ponto[]>([]);
  protected readonly carregando = signal(false);
  protected readonly visao = signal<Visao>('cartoes');
  protected readonly acoes = signal<MenuItem[]>([]);
  /** Painel de cadastro, sempre aberto sem local escolhido: aqui a tela é de todos os locais. */
  protected readonly formVisivel = signal(false);
  /**
   * Estação cuja referência está sendo corrigida; `null` deixa o painel em modo de cadastro.
   * É a **linha** da lista, como na ficha: a listagem já trouxe a referência a corrigir.
   */
  protected readonly emEdicao = signal<Ponto | null>(null);
  protected readonly detalheVisivel = signal(false);
  /**
   * Estação exibida na ficha. É a **linha** da lista, não um registro buscado: a listagem já trouxe
   * referência, local, situação e conteúdo do QR, e não existe `GET /api/pontos/{id}` (research D13).
   */
  protected readonly emDetalhe = signal<Ponto | null>(null);

  protected readonly opcoesVisao: { label: string; value: Visao }[] = [
    { label: 'Cartões', value: 'cartoes' },
    { label: 'Tabela', value: 'tabela' },
  ];
  protected readonly opcoesSituacao = [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Arquivado', value: 'ARQUIVADO' },
  ];

  /** Linhas da tabela: a estação mais os derivados que o filtro de coluna precisa como campo. */
  protected readonly linhas = computed<PontoNaLista[]>(() =>
    this.estacoes().map((estacao) => ({
      ...estacao,
      situacao: estacao.arquivado ? ('ARQUIVADO' as const) : ('ATIVO' as const),
      titulo: this.tituloDe(estacao),
      refCurta: estacao.id.slice(0, 8),
    })),
  );

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

  /**
   * Conjunto que a grade de cartões desenha. Sai do `filteredValue` da própria tabela — `null`
   * quando o filtro não excluiu nada — e não de um segundo estado, que divergiria ao alternar de
   * visualização (research D6).
   */
  protected exibidas(): PontoNaLista[] {
    return (this.tabela()?.filteredValue as PontoNaLista[] | undefined) ?? this.linhas();
  }

  protected qrUrl(id: string): string {
    return this.service.qrUrl(id);
  }

  protected carregar(): void {
    this.carregando.set(true);
    forkJoin({
      ativas: this.service.listarTodos(false),
      arquivadas: this.service.listarTodos(true),
    }).subscribe({
      next: ({ ativas, arquivadas }) => {
        this.estacoes.set([...ativas, ...arquivadas]);
        this.carregando.set(false);
        // Reaplica sobre o conjunto novo: recarregar depois de arquivar não deve mostrar de volta
        // o que o filtro do Gestor exclui.
        this.tabela()?._filter();
      },
      error: () => {
        this.carregando.set(false);
        this.notificarErro('Não foi possível carregar as estações.');
      },
    });
  }

  protected limparFiltros(): void {
    this.tabela()?.clear();
  }

  protected abrirAcoes(evento: Event, estacao: PontoNaLista): void {
    this.acoes.set([
      { label: 'Ver detalhes', command: () => this.verDetalhes(estacao) },
      // Consultar antes de escrever, e a ação que tira da lista por último.
      { label: 'Editar referência', command: () => this.editar(estacao) },
      estacao.arquivado
        ? { label: 'Reativar', command: () => this.reativar(estacao) }
        : { label: 'Arquivar', command: () => this.arquivar(estacao) },
    ]);
    this.menuAcoes()?.toggle(evento);
  }

  /** Abre a ficha com a linha que o Gestor escolheu, sem consultar o servidor de novo. */
  protected verDetalhes(estacao: PontoNaLista): void {
    this.emDetalhe.set(estacao);
    this.detalheVisivel.set(true);
  }

  protected novaEstacao(): void {
    // Zera a estação em correção: sem isso o painel abriria editando a última corrigida.
    this.emEdicao.set(null);
    this.formVisivel.set(true);
  }

  /**
   * Abre o mesmo painel em modo de correção da referência (FR-039). Chegam aqui os dois caminhos —
   * o menu da linha e o `(editar)` da ficha —, que antes não tinham destino nenhum.
   */
  protected editar(estacao: Ponto): void {
    this.emEdicao.set(estacao);
    this.formVisivel.set(true);
  }

  /**
   * Recebe {@link Ponto} e não a linha: as mesmas escritas chegam pelo menu da linha, que tem os
   * derivados, e pela ficha, que devolve a estação crua.
   */
  protected arquivar(estacao: Ponto): void {
    this.service.arquivar(estacao.id).subscribe({
      next: () => {
        this.mensagens.add({
          severity: 'success',
          summary: 'Arquivada',
          detail: `"${this.tituloDe(estacao)}" saiu da lista ativa.`,
        });
        this.carregar();
      },
      error: () => this.notificarErro('Não foi possível arquivar a estação.'),
    });
  }

  protected reativar(estacao: Ponto): void {
    this.service.reativar(estacao.id).subscribe({
      next: () => {
        this.mensagens.add({
          severity: 'success',
          summary: 'Reativada',
          detail: `"${this.tituloDe(estacao)}" voltou para as ativas.`,
        });
        this.carregar();
      },
      error: () => this.notificarErro('Não foi possível reativar a estação.'),
    });
  }

  /**
   * Como a estação é chamada: a referência, ou a referência curta quando ela não existe (FR-013).
   * Nunca um rótulo inventado — "estação 1" viraria o nome da coisa no cartão e no adesivo impresso.
   *
   * <p>Serve à linha e às mensagens pelo mesmo caminho: duas derivações do mesmo rótulo divergiriam,
   * com o toast chamando a estação de um jeito e a lista de outro.
   */
  private tituloDe(estacao: Ponto): string {
    return estacao.referencia ?? estacao.id.slice(0, 8);
  }

  private notificarErro(detalhe: string): void {
    this.mensagens.add({ severity: 'error', summary: 'Erro', detail: detalhe });
  }
}
