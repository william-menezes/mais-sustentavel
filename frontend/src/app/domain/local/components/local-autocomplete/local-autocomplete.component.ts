import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';

import { LocalService } from '../../apis/local.api';
import { Local } from '../../interfaces/local.interface';
import { LocalForm } from '../local-form/local-form.component';

/**
 * Campo de busca de Local com sugestões, para formulários que precisam apontar para um local
 * (FR-020). Vive em `domain/local/` porque conhece o domínio Local: busca locais, exibe endereço e
 * abre o formulário de Local. Quem hospeda só recebe o local escolhido.
 *
 * <p><b>Filtro no cliente, uma carga só</b> (research D7): a operação tem dezenas de locais, não
 * milhares. Consultar a cada tecla acrescentaria latência e um endpoint de busca para resolver um
 * problema que o cliente resolve sozinho.
 *
 * <p>A carga é disparada pelo **primeiro uso do campo**, e não pela criação do componente: painel
 * fechado ainda instancia o conteúdo projetado, então carregar no construtor fazia toda tela que
 * hospeda o cadastro de estação pedir a lista de locais só por existir — inclusive a ficha de uma
 * estação, que nunca abre este campo.
 *
 * <p><b>Acento e caixa não contam</b>: "Uberlandia" encontra "Uberlândia" e "Sao Jose" encontra
 * "São José", porque os dois lados da comparação são normalizados. Quem digita rápido não acentua,
 * então exigir o acento transformaria a busca em adivinhação.
 *
 * <p><b>Somente locais ativos</b> (FR-021): local arquivado não recebe estação nova, e oferecê-lo
 * produziria uma recusa do servidor logo depois — erro que a interface evita em vez de traduzir.
 *
 * <p><b>Busca sem resultado não é erro</b>, é o gatilho da US5: o estado vazio oferece cadastrar o
 * local ali mesmo, no {@link LocalForm} já existente (FR-042, FR-048), aberto **sobre** o painel que
 * hospeda o campo. Ao concluir, o local criado volta escolhido no campo (FR-045).
 */
@Component({
  selector: 'app-local-autocomplete',
  imports: [FormsModule, AutoCompleteModule, ButtonModule, LocalForm],
  templateUrl: './local-autocomplete.component.html',
  styleUrl: './local-autocomplete.component.scss',
})
export class LocalAutocomplete {
  private readonly service = inject(LocalService);

  /** Local escolhido (two-way com quem hospeda o campo). */
  readonly local = model<Local | null>(null);
  /**
   * Nível do painel onde o campo vive, para o formulário de Local abrir um acima (FR-043).
   *
   * <p>0 quando o painel que hospeda é o de base; 1 quando ele mesmo já está empilhado.
   */
  readonly nivel = input(0);
  /** Id do input, para o `<label for>` do formulário que hospeda o campo. */
  readonly inputId = input('local');
  readonly placeholder = input('Busque pelo nome ou pelo bairro');

  /** Acervo de locais ativos, carregado uma única vez (D7). */
  private readonly acervo = signal<Local[]>([]);
  /**
   * Se a carga já foi disparada. Campo simples, e não signal: controla fluxo, não alimenta
   * exibição — virar signal só criaria uma dependência que nenhum template lê.
   */
  private carregou = false;
  /**
   * Se já houve alguma busca. Separa "ainda não procurei" de "procurei e não achei" — só o segundo
   * oferece cadastrar o local, senão a oferta apareceria antes de a pessoa digitar qualquer coisa.
   */
  private readonly buscou = signal(false);

  protected readonly sugestoes = signal<Local[]>([]);
  /** Último termo buscado; nomeia na oferta de cadastro o que não foi encontrado. */
  protected readonly consulta = signal('');
  protected readonly carregando = signal(false);
  protected readonly erroAoCarregar = signal(false);
  /** Visibilidade do formulário de Local, empilhado sobre o painel que hospeda o campo. */
  protected readonly formularioVisivel = signal(false);
  /**
   * Valor cru do campo: o Local escolhido, ou o texto enquanto se digita.
   *
   * <p>Existe porque o `p-autocomplete` sem `forceSelection` grava no modelo o texto digitado. Sem
   * este intermediário, uma string vazaria para `local` e o formulário que hospeda acreditaria ter
   * um local escolhido quando só há texto solto.
   */
  protected readonly valorCampo = signal<Local | string | null>(null);

  /** Um nível acima do painel que hospeda o campo: o formulário de Local abre sobre ele (FR-043). */
  protected readonly nivelDoFormulario = computed(() => this.nivel() + 1);

  /** Busca feita e nada encontrado — o gatilho da oferta de cadastro (FR-042). */
  protected readonly semResultado = computed(
    () =>
      this.buscou() &&
      !this.carregando() &&
      !this.erroAoCarregar() &&
      this.sugestoes().length === 0,
  );

  constructor() {
    // Espelha no campo o local escolhido de fora — o pré-selecionado por quem hospeda e o
    // recém-criado no formulário empilhado. Sem isso o campo ficaria vazio enquanto o formulário
    // já considera o local escolhido.
    effect(() => {
      const escolhido = this.local();
      if (escolhido) {
        this.valorCampo.set(escolhido);
      }
    });
  }

  /**
   * Sem diacríticos e em minúsculas: os dois lados da comparação passam por aqui (D7). O `NFD`
   * separa o acento da letra, e a faixa `\u0300-\u036f` — os diacríticos combinados — é o que sai.
   */
  private static normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  /** Bairro e cidade, para distinguir dois locais de nome parecido na lista de sugestões. */
  protected detalhe(local: Local): string {
    return [local.bairro, local.cidade].filter(Boolean).join(' · ');
  }

  protected filtrar(evento: { query: string }): void {
    this.consulta.set(evento.query);
    this.buscou.set(true);
    this.carregar();
    this.aplicarFiltro();
  }

  protected aoMudarCampo(valor: Local | string | null): void {
    this.valorCampo.set(valor);
    // Texto solto não é local escolhido: enquanto se digita outra busca, quem hospeda volta a estar
    // com o campo pendente, e o rodapé volta a cobrá-lo.
    this.local.set(typeof valor === 'object' ? valor : null);
  }

  protected abrirNovoLocal(): void {
    this.formularioVisivel.set(true);
  }

  /**
   * Local criado no formulário empilhado: volta escolhido no campo e o painel de cima fecha
   * (FR-045). Ele entra no acervo já carregado para as buscas seguintes o encontrarem — recarregar
   * a lista inteira por causa de um item seria uma consulta a mais para um dado que já está em mãos.
   */
  protected aoSalvarLocal(criado: Local): void {
    this.acervo.update((locais) => [...locais, criado]);
    this.aoMudarCampo(criado);
    this.sugestoes.set([criado]);
    this.buscou.set(false);
    this.formularioVisivel.set(false);
  }

  /** Carga única, na primeira busca. Chamadas seguintes não consultam o servidor de novo (D7). */
  private carregar(): void {
    if (this.carregou) {
      return;
    }
    this.carregou = true;
    this.carregando.set(true);
    this.erroAoCarregar.set(false);

    this.service.listar().subscribe({
      next: (locais) => {
        // A API já devolve só os ativos; filtrar aqui também mantém a garantia do FR-021 no
        // componente que a exibe, e não numa combinação de parâmetro com contrato de resposta.
        const ativos = locais.filter((local) => !local.arquivado);
        // Um local cadastrado aqui antes da resposta chegar continua no acervo: a lista do servidor
        // foi pedida antes de ele existir, e deixá-lo cair fora o faria desaparecer da busca.
        const criadosAqui = this.acervo().filter(
          (local) => !ativos.some((ativo) => ativo.id === local.id),
        );
        this.acervo.set([...ativos, ...criadosAqui]);
        this.carregando.set(false);
        // Reaplica a última busca: as primeiras teclas podem chegar antes da resposta.
        this.aplicarFiltro();
      },
      error: () => {
        this.carregando.set(false);
        this.erroAoCarregar.set(true);
      },
    });
  }

  private aplicarFiltro(): void {
    const busca = LocalAutocomplete.normalizar(this.consulta());
    const ativos = this.acervo();

    if (!busca) {
      this.sugestoes.set([...ativos]);
      return;
    }

    this.sugestoes.set(
      ativos.filter(
        (local) =>
          LocalAutocomplete.normalizar(local.nome).includes(busca) ||
          LocalAutocomplete.normalizar(local.bairro ?? '').includes(busca),
      ),
    );
  }
}
