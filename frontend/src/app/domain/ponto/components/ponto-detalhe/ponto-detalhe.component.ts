import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { map, of, switchMap } from 'rxjs';

import { ColetaService } from '@domain/coleta/apis/coleta.api';
import { Coleta } from '@domain/coleta/interfaces/coleta.interface';
import { LocalService } from '@domain/local/apis/local.api';
import { LocalDetalhe } from '@domain/local/components/local-detalhe/local-detalhe.component';
import { Local } from '@domain/local/interfaces/local.interface';
import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

/**
 * Painel de leitura de uma estação de coleta: identificação, QR com endereço público, os três
 * indicadores de volume (VH-02 no nível da estação) e o histórico de coletas. Reaproveita o
 * {@link FormDrawer} com `closable` ligado e rodapé próprio, porque aqui não há nada para salvar.
 *
 * <p>A estação chega **por input**, da linha que abriu a ficha: a listagem já trouxe referência,
 * local, situação e conteúdo do QR, e não existe `GET /api/pontos/{id}` (research D13). A única
 * consulta é a do histórico — e ela é **uma só**, alimentando os três indicadores e a lista, o que
 * torna impossível os números divergirem do que está listado embaixo deles (research D5, SC-007).
 *
 * <p>Arquivar, reativar e editar saem como outputs para quem hospeda, que já concentra toast e
 * recarga da lista. Ao disparar qualquer uma dessas escritas a ficha **fecha**: recebendo a estação
 * por input, ela continuaria exibindo a situação ou a referência anteriores.
 *
 * <p>Registrar coleta **navega** para a tela que já existe (`/pontos/:id/coletas`) em vez de
 * reimplementar o formulário — recorte registrado em *Out of Scope* da 007.
 */
@Component({
  selector: 'app-ponto-detalhe',
  imports: [FormDrawer, LocalDetalhe, ButtonModule, TagModule],
  templateUrl: './ponto-detalhe.component.html',
  styleUrl: './ponto-detalhe.component.scss',
})
export class PontoDetalhe {
  private readonly coletaService = inject(ColetaService);
  private readonly pontoService = inject(PontoService);
  private readonly localService = inject(LocalService);
  private readonly router = inject(Router);

  private readonly numeros = new Intl.NumberFormat('pt-BR');
  /**
   * Sem centavos de propósito: o fundo social é R$ 1,00 por litro (RN-G-02), então os centavos
   * seriam sempre zero e só roubariam espaço do indicador. É o mesmo formato da ficha do Local.
   */
  private readonly moeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
  /** A média é a única derivação de verdade da ficha; uma casa basta para lê-la (research D5). */
  private readonly media = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

  /** Visibilidade do painel (two-way com quem hospeda). */
  readonly visivel = model<boolean>(false);
  /** Estação exibida; `null` mantém o painel sem conteúdo (nada é buscado). */
  readonly ponto = input<Ponto | null>(null);

  readonly editar = output<Ponto>();
  readonly arquivar = output<Ponto>();
  readonly reativar = output<Ponto>();

  protected readonly coletas = signal<Coleta[]>([]);
  /**
   * Total de litros **do servidor**, somado em `BigDecimal`. `null` enquanto carrega ou depois de
   * falhar — o que é diferente de zero, e é o que permite exibir ausência em vez de mentira.
   */
  protected readonly totalLitros = signal<number | null>(null);
  protected readonly carregandoColetas = signal(false);
  /** Falha da consulta: degrada esta seção com aviso, sem derrubar o painel (FR-041). */
  protected readonly erroColetas = signal(false);

  protected readonly copiado = signal(false);
  protected readonly erroCopia = signal(false);

  /** Ficha do Local, empilhada sobre esta (FR-037). */
  protected readonly localVisivel = signal(false);
  protected readonly local = signal<Local | null>(null);
  protected readonly carregandoLocal = signal(false);
  protected readonly erroLocal = signal(false);

  /**
   * A referência identifica a estação (FR-014); sem ela, a referência curta do identificador
   * (FR-013). Nunca um rótulo inventado — um "estação 1" apareceria como o nome da coisa em toda a
   * interface, e no adesivo impresso. O `trim` cobre o registro que ficou só com espaços.
   */
  protected readonly titulo = computed(() => {
    const alvo = this.ponto();
    if (!alvo) {
      // Só aparece com o painel aberto sem estação, quando o corpo está vazio: não nomeia estação
      // nenhuma, apenas evita um cabeçalho em branco.
      return 'Estação';
    }
    return alvo.referencia?.trim() || this.refCurta();
  });

  /** Primeiros oito caracteres do id — a abreviação usada para citar uma estação. */
  protected readonly refCurta = computed(() => this.ponto()?.id.slice(0, 8) ?? '');

  /** Trilha sem links: o `form-drawer` vive em `widget/` e não conhece o roteador. */
  protected readonly trilha = computed<MenuItem[]>(() => [
    { label: 'Home' },
    { label: 'Pontos de coleta' },
    { label: this.ponto() ? this.titulo() : '' },
  ]);

  protected readonly localNome = computed(() => this.ponto()?.localNome ?? '');
  protected readonly arquivado = computed(() => this.ponto()?.arquivado ?? false);
  protected readonly rotuloArquivamento = computed(() =>
    this.arquivado() ? 'Reativar estação' : 'Arquivar estação',
  );

  protected readonly urlDoQr = computed(() => {
    const alvo = this.ponto();
    return alvo ? this.pontoService.qrUrl(alvo.id) : '';
  });

  /**
   * Endereço público como o material de referência o mostra: sem o esquema e com o identificador
   * abreviado (`sustentavel.app/p/96e96ba8`), para caber na largura do painel.
   *
   * <p>Depois de a cópia falhar, exibe o endereço **inteiro**: aí a única saída é selecionar o texto
   * à mão, e selecionar o abreviado entregaria justamente o link que não abre (research D11).
   */
  protected readonly enderecoExibido = computed(() => {
    const conteudo = this.ponto()?.qrConteudo ?? '';
    if (this.erroCopia()) {
      return conteudo;
    }
    const semEsquema = conteudo.replace(/^https?:\/\//i, '');
    const corte = semEsquema.lastIndexOf('/');
    if (corte < 0) {
      return semEsquema;
    }
    return semEsquema.slice(0, corte + 1) + semEsquema.slice(corte + 1).slice(0, 8);
  });

  protected readonly litrosFormatado = computed(() => {
    const total = this.totalLitros();
    return total === null ? '—' : `${this.numeros.format(total)} L`;
  });

  protected readonly fundoSocialFormatado = computed(() => {
    const total = this.totalLitros();
    // R$ 1,00 por litro real (RN-G-02): a conversão é a identidade, não uma tabela de preço.
    return total === null ? '—' : this.moeda.format(total);
  });

  /**
   * Total ÷ quantidade de coletas. Sem coleta nenhuma a média **não existe** e sai como ausência,
   * nunca zero: zero afirmaria que as coletas vieram vazias (FR-034).
   */
  protected readonly mediaFormatada = computed(() => {
    const total = this.totalLitros();
    const quantidade = this.coletas().length;
    if (total === null || quantidade === 0) {
      return '—';
    }
    return `${this.media.format(total / quantidade)} L`;
  });

  /**
   * Da coleta mais recente para a mais antiga (FR-035). O servidor já devolve nessa ordem, mas a
   * garantia é da tela: ordenar aqui mantém o requisito verificável sem depender de um detalhe do
   * repositório. `data` é ISO `YYYY-MM-DD`, então comparar como texto já ordena por cronologia.
   */
  protected readonly historico = computed(() =>
    [...this.coletas()].sort(
      (a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm),
    ),
  );

  constructor() {
    // Consulta a cada abertura: podem ter sido registradas coletas desde a última vez.
    effect(() => {
      const alvo = this.ponto();
      if (!this.visivel() || !alvo) {
        return;
      }
      this.copiado.set(false);
      this.erroCopia.set(false);
      this.erroLocal.set(false);
      this.carregarColetas(alvo.id);
    });
  }

  /**
   * `dd/MM/yyyy` a partir do ISO só de dia, por recorte de texto e não pelo `DatePipe`: uma data sem
   * hora é lida como meia-noite UTC e, no fuso de Brasília, apareceria um dia antes.
   */
  protected dataBr(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  protected litrosDaColeta(coleta: Coleta): string {
    return `${this.numeros.format(coleta.litrosReais)} L`;
  }

  /**
   * Copia o **`qrConteudo` inteiro**, nunca o texto exibido: a exibição é abreviada no
   * identificador, e um link truncado não abre a estação (FR-031, research D11).
   */
  protected async copiar(): Promise<void> {
    const alvo = this.ponto();
    if (!alvo) {
      return;
    }
    this.copiado.set(false);
    this.erroCopia.set(false);
    try {
      // A API exige contexto seguro e pode ser negada por permissão; nesse caso nem existe.
      await navigator.clipboard.writeText(alvo.qrConteudo);
      this.copiado.set(true);
    } catch {
      // Falhar em silêncio faria colar o conteúdo anterior da área de transferência sem perceber.
      this.erroCopia.set(true);
    }
  }

  /** Envolve {@link copiar} para o template não deixar uma promessa solta no binding. */
  protected aoCopiar(): void {
    void this.copiar();
  }

  protected baixarQr(): void {
    const alvo = this.ponto();
    if (!alvo) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.pontoService.qrUrl(alvo.id);
    // Referência curta no nome do arquivo: é como o Gestor identifica o adesivo entre vários baixados.
    link.download = `qr-${this.refCurta()}.png`;
    link.click();
  }

  /** Leva ao registro de coleta que já tem tela própria, em vez de reimplementar o formulário. */
  protected registrarColeta(): void {
    const alvo = this.ponto();
    if (!alvo) {
      return;
    }
    // Sem fechar o painel: a troca de rota substitui a tela inteira e o leva com ela.
    void this.router.navigate(['/pontos', alvo.id, 'coletas']);
  }

  /** Abre a ficha do Local **por cima** desta, que fica aberta atrás (FR-037). */
  protected verLocal(): void {
    const alvo = this.ponto();
    if (!alvo || this.carregandoLocal()) {
      return;
    }
    if (this.local()?.id === alvo.localId) {
      this.localVisivel.set(true);
      return;
    }
    this.buscarLocal(alvo.localId);
  }

  protected aoEditar(): void {
    const alvo = this.ponto();
    if (!alvo) {
      return;
    }
    // Fecha antes de emitir: o formulário de edição abre por cima e, ao voltar, esta ficha estaria
    // mostrando a referência anterior — melhor sair do que exibir dado velho (research D13).
    this.visivel.set(false);
    this.editar.emit(alvo);
  }

  protected aoAlternarArquivamento(): void {
    const alvo = this.ponto();
    if (!alvo) {
      return;
    }
    // Idem: a situação no cabeçalho acabou de mudar e o painel não recebe a estação atualizada.
    this.visivel.set(false);
    if (alvo.arquivado) {
      this.reativar.emit(alvo);
    } else {
      this.arquivar.emit(alvo);
    }
  }

  /** Uma consulta só alimenta os três indicadores e o histórico (research D5). */
  private carregarColetas(pontoId: string): void {
    this.carregandoColetas.set(true);
    this.erroColetas.set(false);
    this.coletas.set([]);
    this.totalLitros.set(null);

    this.coletaService.listar(pontoId).subscribe({
      next: (resposta) => {
        this.coletas.set(resposta.coletas);
        this.totalLitros.set(resposta.totalLitros);
        this.carregandoColetas.set(false);
      },
      error: () => {
        this.carregandoColetas.set(false);
        this.erroColetas.set(true);
      },
    });
  }

  /**
   * A ficha do Local precisa do Local inteiro, e aqui só se tem `localId` e `localNome`.
   * `LocalService` não expõe busca por id, então a estação o procura na coleção de ativos.
   */
  private buscarLocal(localId: string): void {
    this.carregandoLocal.set(true);
    this.erroLocal.set(false);

    this.localService
      .listar()
      .pipe(
        map((ativos) => ativos.find((item) => item.id === localId) ?? null),
        switchMap((achado) =>
          achado
            ? of(achado)
            : // Estação cujo local foi arquivado depois continua vinculada a ele (RN-G-05), e a
              // coleção de ativos não o traz. A segunda ida ao servidor acontece só nesse caso.
              this.localService
                .listar(true)
                .pipe(map((arquivados) => arquivados.find((item) => item.id === localId) ?? null)),
        ),
      )
      .subscribe({
        next: (achado) => {
          this.carregandoLocal.set(false);
          if (!achado) {
            this.erroLocal.set(true);
            return;
          }
          this.local.set(achado);
          this.localVisivel.set(true);
        },
        error: () => {
          this.carregandoLocal.set(false);
          // Aviso na seção do Local, e não painel aberto vazio: um painel sem conteúdo pareceria travado.
          this.erroLocal.set(true);
        },
      });
  }
}
