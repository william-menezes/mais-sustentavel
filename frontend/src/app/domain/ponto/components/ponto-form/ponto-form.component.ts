import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { LocalAutocomplete } from '@domain/local/components/local-autocomplete/local-autocomplete.component';
import { Local } from '@domain/local/interfaces/local.interface';
import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';
import { PontoService } from '../../apis/ponto.api';
import { Ponto } from '../../interfaces/ponto.interface';

/**
 * Cadastro de estação em painel sobreposto, aberto pela visão geral de estações (nível 0) ou pela
 * ficha do Local (nível 1). Recebendo `estacao`, o mesmo painel **corrige a referência** de uma
 * estação existente (FR-039).
 *
 * <p>Dois campos e nada mais: o **local** que recebe a estação e a **referência** que diz onde ela
 * fica dentro dele (FR-020, FR-011). O QR não é campo — o servidor o gera ao concluir, e o painel
 * diz isso em vez de deixar o Gestor procurando onde preencher (FR-022). O passo depois da criação
 * mostra o QR gerado, que é o motivo pelo qual alguém cadastra uma estação: imprimir e fixar no
 * lugar onde o óleo é entregue.
 *
 * <p>Quando o local **já é conhecido** — abertura pela ficha do Local — o campo de busca não
 * aparece: perguntar o que já se sabe seria trabalho inventado. Nos outros casos o local é escolhido
 * pelo {@link LocalAutocomplete}, que também sabe cadastrar um local que ainda não existe, num painel
 * empilhado sobre este.
 *
 * <p><b>O que já foi digitado sobrevive a esse desvio</b> (FR-046): a referência é estado deste
 * componente, e o painel de baixo continua vivo enquanto o de cima está aberto. A limpeza acontece
 * só na abertura e no fechamento, nunca durante — é o ponto da US5, e o que se perderia se o
 * cadastro do local exigisse sair daqui.
 *
 * <p><b>Correção da referência</b> (FR-039): só a referência muda. O local é exibido como dado e não
 * como campo, porque o vínculo é imutável (RN-G-05) — e concluir faz `PUT` na estação, nunca um
 * `POST` que criaria uma segunda no mesmo local. Não há passo de QR depois: o código é o mesmo, e o
 * adesivo já está fixado no lugar da entrega. O desfecho é fechar e avisar.
 */
@Component({
  selector: 'app-ponto-form',
  imports: [FormsModule, FormDrawer, LocalAutocomplete, ButtonModule, InputTextModule],
  templateUrl: './ponto-form.component.html',
  styleUrl: './ponto-form.component.scss',
})
export class PontoForm {
  private readonly service = inject(PontoService);
  private readonly mensagens = inject(MessageService);

  /** Tamanho máximo da referência (FR-017) — cabe como título de cartão sem truncar. */
  protected static readonly MAX_REFERENCIA = 60;

  /** Visibilidade do painel (two-way com quem hospeda). */
  readonly visivel = model<boolean>(false);
  /**
   * Local já conhecido quando o painel abre pela ficha de um Local. Com ele, o campo de busca sai de
   * cena; `null` deixa a escolha para o campo de busca.
   */
  readonly local = input<Local | null>(null);
  /**
   * Estação em correção. Com ela o painel entra em modo de edição; `null` cadastra uma nova.
   *
   * <p>É a **linha da lista** ou a estação da ficha, não um registro buscado: não existe
   * `GET /api/pontos/{id}` (research D13), e a referência a corrigir já veio na listagem.
   */
  readonly estacao = input<Ponto | null>(null);
  /**
   * Profundidade na pilha de painéis: 0 aberto pela visão geral, 1 aberto pela ficha do Local.
   *
   * <p>O campo de busca recebe o mesmo nível, para abrir o formulário de Local um acima deste.
   */
  readonly nivel = input(0);

  /** Emitido depois de criar, para quem hospeda recarregar a lista de estações. */
  readonly criado = output<Ponto>();
  /** Emitido depois de corrigir a referência, para quem hospeda recarregar a lista (FR-015). */
  readonly editado = output<Ponto>();

  protected readonly maxReferencia = PontoForm.MAX_REFERENCIA;

  /** Uma operação em andamento, seja o cadastro ou a correção: as duas travam o mesmo botão. */
  protected readonly enviando = signal(false);
  /** Estação recém-criada. Enquanto `null`, o painel está no passo de preenchimento. */
  protected readonly novoPonto = signal<Ponto | null>(null);
  /** Local que vai receber a estação: o pré-selecionado, ou o escolhido no campo de busca. */
  protected readonly localEscolhido = signal<Local | null>(null);
  protected readonly referencia = signal('');

  /** Painel em modo de correção da referência, em vez de cadastro (FR-039). */
  protected readonly edicao = computed(() => this.estacao() !== null);

  /**
   * Local exibido como dado e não como campo: conhecido de antemão não se pergunta o que já se sabe
   * (FR-019), e em correção o vínculo é imutável — trocar de local não é o que se está fazendo
   * (RN-G-05).
   */
  protected readonly localFixo = computed(() => this.edicao() || this.local() !== null);

  /** Nome a exibir: o da estação em correção, ou o do local escolhido no cadastro. */
  protected readonly nomeDoLocal = computed(
    () => this.estacao()?.localNome ?? this.localEscolhido()?.nome ?? '',
  );

  /**
   * Local arquivado não aceita estação nova — a API recusa. Barrar aqui evita oferecer uma ação que
   * só poderia terminar em erro, e diz o motivo em vez de deixar o Gestor descobrir pelo toast.
   *
   * <p>Só acontece com local pré-selecionado: o campo de busca não oferece arquivados (FR-021).
   */
  protected readonly arquivado = computed(() => this.localEscolhido()?.arquivado ?? false);

  /** Referência sem os espaços em volta — é esta que viaja para a API (FR-016). */
  protected readonly referenciaLimpa = computed(() => this.referencia().trim());

  /** Título do painel: o que se está fazendo, não sempre um cadastro. */
  protected readonly titulo = computed(() =>
    this.edicao() ? 'Corrigir referência' : 'Novo ponto de coleta',
  );

  protected readonly trilha = computed<MenuItem[]>(() => {
    if (this.edicao()) {
      return [{ label: 'Home' }, { label: 'Pontos de coleta' }, { label: 'Corrigir referência' }];
    }
    return this.local()
      ? [
          { label: 'Home' },
          { label: 'Locais' },
          { label: this.local()?.nome ?? '' },
          { label: 'Novo ponto' },
        ]
      : [{ label: 'Home' }, { label: 'Pontos de coleta' }, { label: 'Novo ponto' }];
  });

  /**
   * O que falta preencher, nomeado no rodapé do painel (FR-049) na ordem em que os campos aparecem.
   *
   * <p>Uma pendência por vez, e não a lista inteira: são dois campos, e o segundo só faz sentido
   * depois do primeiro. O aviso desaparece quando nada falta (FR-050) — e some no passo do QR, onde
   * não há mais nada a preencher.
   */
  protected readonly pendencia = computed(() => {
    if (this.novoPonto() || this.arquivado()) {
      return '';
    }
    // Em correção o local não é escolhível, então não pode ser cobrado como pendência.
    if (!this.edicao() && !this.localEscolhido()) {
      return 'Escolha o local do ponto.';
    }
    if (!this.referenciaLimpa()) {
      return 'Informe a referência da estação — onde ela fica dentro do local.';
    }
    return '';
  });

  /**
   * Concluir indisponível enquanto local ou referência estiverem pendentes (FR-024).
   *
   * <p>Derivado da mesma expressão que monta o aviso, para os dois não divergirem: o botão libera
   * exatamente quando o aviso sai.
   */
  protected readonly concluirDesabilitado = computed(
    () => this.pendencia() !== '' || this.arquivado() || this.enviando(),
  );

  /** O rótulo diz o que a ação faz: em correção não se gera ponto nenhum. */
  protected readonly rotuloConcluir = computed(() => {
    if (this.edicao()) {
      return this.enviando() ? 'Salvando…' : 'Salvar referência';
    }
    return this.enviando() ? 'Gerando…' : 'Gerar ponto';
  });

  /** Referência curta da estação criada — a abreviação de oito caracteres usada nas telas. */
  protected readonly refCurta = computed(() => this.novoPonto()?.id.slice(0, 8) ?? '');

  /** Identificação da estação criada: a referência com o local compondo (FR-014). */
  protected readonly identificacaoDoCriado = computed(() => {
    const ponto = this.novoPonto();
    return ponto ? [ponto.referencia, ponto.localNome].filter(Boolean).join(' · ') : '';
  });

  protected readonly urlDoQr = computed(() => {
    const ponto = this.novoPonto();
    return ponto ? this.service.qrUrl(ponto.id) : '';
  });

  constructor() {
    // Prepara o painel a cada abertura, e a cada troca da estação em correção — sem depender da
    // ordem em que os dois inputs chegam. O corpo vai em `untracked` para que escolher um local ou
    // digitar a referência não disparem uma limpeza no meio do preenchimento, que é justamente o
    // que a US5 existe para não acontecer (FR-046).
    effect(() => {
      const emCorrecao = this.estacao();
      if (!this.visivel()) {
        return;
      }
      untracked(() => {
        // Em correção o local não é escolhível: ele é exibido a partir da própria estação.
        this.localEscolhido.set(emCorrecao ? null : this.local());
        // A referência atual já vem preenchida; sem ela (acervo anterior à V7) o campo abre vazio.
        this.referencia.set(emCorrecao?.referencia ?? '');
        this.novoPonto.set(null);
      });
    });
  }

  /** Ação principal do rodapé: cadastra a estação, ou salva a referência corrigida (FR-039). */
  protected concluir(): void {
    if (this.edicao()) {
      this.salvarReferencia();
    } else {
      this.criar();
    }
  }

  protected criar(): void {
    const alvo = this.localEscolhido();
    const referencia = this.referenciaLimpa();
    if (!alvo || !referencia || this.arquivado() || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.service.criar(alvo.id, { referencia }).subscribe({
      next: (ponto) => {
        this.enviando.set(false);
        this.novoPonto.set(ponto);
        this.mensagens.add({
          severity: 'success',
          summary: 'Ponto criado',
          detail: 'QR Code gerado para esta estação.',
        });
        // Avisa agora, não no fechar: a tela atrás já mostra a estação nova enquanto o QR está à vista.
        this.criado.emit(ponto);
      },
      error: () => {
        this.enviando.set(false);
        this.mensagens.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível criar o ponto de coleta.',
        });
      },
    });
  }

  /**
   * `PUT` na estação existente: só a referência muda, e o local nunca vai no corpo (RN-G-05).
   * Chamar `criar` aqui abriria uma segunda estação no mesmo local em vez de renomear esta.
   */
  private salvarReferencia(): void {
    const alvo = this.estacao();
    const referencia = this.referenciaLimpa();
    if (!alvo || !referencia || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.service.editar(alvo.id, { referencia }).subscribe({
      next: (ponto) => {
        this.enviando.set(false);
        this.mensagens.add({
          severity: 'success',
          summary: 'Referência atualizada',
          detail: `A estação agora é "${referencia}".`,
        });
        this.editado.emit(ponto);
        // Sem passo de QR: o código não mudou e o adesivo já está na parede. Fechar é o desfecho.
        this.fechar();
      },
      error: () => {
        this.enviando.set(false);
        this.mensagens.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível salvar a referência.',
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
    link.download = `qr-${this.refCurta()}.png`;
    link.click();
  }

  protected fechar(): void {
    this.visivel.set(false);
    // Zera o painel para que a próxima abertura comece no preenchimento, e não no QR anterior.
    this.novoPonto.set(null);
    this.referencia.set('');
    this.localEscolhido.set(null);
  }
}
