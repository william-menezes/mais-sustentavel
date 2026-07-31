import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { PontoService } from '@domain/ponto/apis/ponto.api';
import { PontoForm } from '@domain/ponto/components/ponto-form/ponto-form.component';
import { Ponto } from '@domain/ponto/interfaces/ponto.interface';
import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';
import { rotuloTipo } from '../../constants/tipo-local.constant';
import { Local } from '../../interfaces/local.interface';

/**
 * Painel de leitura de um Local: identificação, indicadores acumulados, endereço completo e os
 * pontos de coleta que pertencem a ele. Reaproveita o {@link FormDrawer} com `closable` ligado e
 * rodapé próprio, porque aqui não há nada para salvar.
 *
 * <p>Arquivar, reativar e editar saem como outputs para a página, que já concentra o tratamento de
 * erro, o toast e a recarga da lista. Litros e valor social chegam por input do agregado que a
 * listagem já buscou — o detalhe não repete a chamada.
 *
 * <p>Cadastrar ponto é a exceção e fica aqui: abre um {@link PontoForm} **empilhado por cima** desta
 * ficha, que continua aberta atrás. É esta ficha que mostra a lista de pontos, então é ela que
 * precisa recarregá-la ao final — devolver a ação para a página só traria o trabalho de volta.
 *
 * <p><b>O que o mock de referência mostra e esta tela não:</b> litros por ponto ("614 L") e data da
 * última coleta ("coleta 11/07"). O agregado de impacto só desce por local, não por ponto, e buscar
 * coleta por ponto seria uma chamada por linha (N+1) para um dado que a visão geral de estações e a
 * ficha de cada uma já mostram. A **referência** do ponto passou a existir na 007 e é exibida lá; aqui
 * a lista segue pela referência curta, que é o que identifica a estação sem depender do rótulo.
 */
@Component({
  selector: 'app-local-detalhe',
  imports: [DatePipe, FormDrawer, PontoForm, ButtonModule, TagModule],
  templateUrl: './local-detalhe.component.html',
  styleUrl: './local-detalhe.component.scss',
})
export class LocalDetalhe {
  private readonly pontoService = inject(PontoService);

  private readonly numeros = new Intl.NumberFormat('pt-BR');
  /**
   * Sem centavos de propósito: o valor social é R$ 1,00 por litro (RN-G-02), então os centavos
   * seriam sempre zero e só roubariam espaço do indicador.
   */
  private readonly moeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

  /** Visibilidade do painel (two-way com quem hospeda). */
  readonly visivel = model<boolean>(false);
  /** Local exibido; `null` mantém o painel sem conteúdo (nada é buscado). */
  readonly local = input<Local | null>(null);
  /** Litros acumulados vindos do agregado da listagem; `null` = agregado indisponível. */
  readonly litros = input<number | null>(null);
  /** Valor social acumulado vindo do mesmo agregado; `null` = indisponível. */
  readonly valorSocial = input<number | null>(null);
  /**
   * Profundidade na pilha, repassada ao painel compartilhado. `0` quando a ficha abre sobre a lista de
   * Locais; maior quando abre **sobre outro painel** — é o caso de "ver o local" a partir da ficha de
   * uma estação. Sem repassar, as duas fichas sairiam com a mesma largura e a de cima cobriria a de
   * baixo por inteiro, sem o recuo que diz que há algo atrás (FR-044).
   */
  readonly nivel = input(0);

  readonly editar = output<Local>();
  readonly arquivar = output<Local>();
  readonly reativar = output<Local>();

  /** Visibilidade do painel de novo ponto, empilhado sobre esta ficha. */
  protected readonly pontoVisivel = signal(false);
  protected readonly pontos = signal<Ponto[]>([]);
  protected readonly carregandoPontos = signal(false);
  /** Falha da busca de pontos: degrada a seção com um aviso, sem derrubar o painel. */
  protected readonly erroPontos = signal(false);

  protected readonly titulo = computed(() => this.local()?.nome ?? 'Local');

  /** Trilha sem links: o `form-drawer` vive em `widget/` e não conhece o roteador. */
  protected readonly trilha = computed<MenuItem[]>(() => [
    { label: 'Home' },
    { label: 'Locais' },
    { label: this.local()?.nome ?? '' },
  ]);

  protected readonly arquivado = computed(() => this.local()?.arquivado ?? false);
  protected readonly rotuloTipoLocal = computed(() => {
    const alvo = this.local();
    return alvo ? rotuloTipo(alvo.tipo) : '';
  });
  protected readonly rotuloArquivamento = computed(() =>
    this.arquivado() ? 'Reativar local' : 'Arquivar local',
  );

  protected readonly litrosFormatado = computed(() => {
    const valor = this.litros();
    return valor === null ? '—' : `${this.numeros.format(valor)} L`;
  });

  protected readonly valorSocialFormatado = computed(() => {
    const valor = this.valorSocial();
    return valor === null ? '—' : this.moeda.format(valor);
  });

  /**
   * Contagem de pontos. Traço enquanto carrega ou depois de falhar: zero afirmaria que o local não
   * tem ponto nenhum, o que é uma informação diferente de "não conseguimos consultar".
   */
  protected readonly totalPontos = computed(() => {
    if (this.carregandoPontos() || this.erroPontos()) {
      return '—';
    }
    return this.numeros.format(this.pontos().length);
  });

  /**
   * Endereço em uma linha: `rua, número, complemento — bairro · cidade, UF`.
   *
   * Cada grupo é filtrado antes de juntar e os grupos vazios saem com o próprio separador. Sem
   * isso, um local migrado do texto livre (só `rua` preenchida) terminaria em travessão solto.
   */
  protected readonly enderecoCompleto = computed(() => {
    const alvo = this.local();
    if (!alvo) {
      return '';
    }
    const logradouro = [alvo.rua, alvo.numero, alvo.complemento].filter(Boolean).join(', ');
    const municipio = [alvo.cidade, alvo.uf].filter(Boolean).join(', ');
    const local = [logradouro, alvo.bairro].filter(Boolean).join(' — ');
    return [local, municipio].filter(Boolean).join(' · ');
  });

  /** CEP com máscara `00000-000`; `null` quando o local não tem CEP (caso dos migrados). */
  protected readonly cepFormatado = computed(() => {
    const cep = this.local()?.cep;
    if (!cep) {
      return null;
    }
    return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  });

  constructor() {
    // Busca os pontos a cada abertura: a lista pode ter mudado na tela de Pontos desde a última vez.
    effect(() => {
      const alvo = this.local();
      if (!this.visivel() || !alvo) {
        return;
      }
      this.carregarPontos(alvo.id);
    });
  }

  /** Primeiros oito caracteres do id — a mesma referência curta usada na tela de Pontos. */
  protected refCurta(id: string): string {
    return id.slice(0, 8);
  }

  private carregarPontos(localId: string): void {
    this.carregandoPontos.set(true);
    this.erroPontos.set(false);
    this.pontos.set([]);

    // Uma única chamada, com todos os pontos do local. Nada de uma consulta por linha.
    this.pontoService.listar(localId).subscribe({
      next: (pontos) => {
        this.pontos.set(pontos);
        this.carregandoPontos.set(false);
      },
      error: () => {
        this.carregandoPontos.set(false);
        this.erroPontos.set(true);
      },
    });
  }

  protected aoEditar(): void {
    const alvo = this.local();
    if (!alvo) {
      return;
    }
    // Fecha antes de emitir: o formulário de edição abre por cima e, ao voltar, o detalhe estaria
    // exibindo a versão anterior do local — melhor sair do que mostrar dado velho.
    this.visivel.set(false);
    this.editar.emit(alvo);
  }

  protected aoAlternarArquivamento(): void {
    const alvo = this.local();
    if (!alvo) {
      return;
    }
    // Idem: a situação exibida no cabeçalho acabou de mudar e o painel não recebe o local atualizado.
    this.visivel.set(false);
    if (alvo.arquivado) {
      this.reativar.emit(alvo);
    } else {
      this.arquivar.emit(alvo);
    }
  }

  /**
   * Abre o cadastro de ponto **por cima** desta ficha, que fica aberta atrás. Diferente de editar e
   * arquivar: ali o dado exibido aqui muda e o painel sairia de cena; aqui o Gestor volta para a
   * mesma ficha, agora com o ponto novo na lista.
   */
  protected aoNovoPonto(): void {
    if (!this.local()) {
      return;
    }
    this.pontoVisivel.set(true);
  }

  /** Recarrega a lista para o ponto recém-criado aparecer, com o painel de cima ainda visível. */
  protected aoPontoCriado(): void {
    const alvo = this.local();
    if (alvo) {
      this.carregarPontos(alvo.id);
    }
  }
}
