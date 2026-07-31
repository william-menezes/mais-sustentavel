import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { FormDrawer } from '@widget/components/form-drawer/form-drawer.component';
import { CepService } from '../../apis/cep.api';
import { LocalService } from '../../apis/local.api';
import { TIPOS_LOCAL } from '../../constants/tipo-local.constant';
import { UFS } from '../../constants/uf.constant';
import { Local, LocalRequest, TipoLocal, Uf } from '../../interfaces/local.interface';

/**
 * Cadastro e edição de Local num painel sobreposto à lista. Quando recebe `local`, entra em modo
 * edição (pré-preenche e faz PUT); sem ele, cadastra (POST). Emite `salvo` com o Local resultante
 * para o pai atualizar a listagem.
 *
 * <p>A validação não exibe mensagem por campo: o botão salvar simplesmente fica indisponível até
 * os obrigatórios estarem completos (FR-025). O `erro` é reservado para falha de salvamento.
 */
@Component({
  selector: 'app-local-form',
  imports: [FormsModule, FormDrawer, InputTextModule, InputMaskModule, SelectModule, MessageModule],
  templateUrl: './local-form.component.html',
  styleUrl: './local-form.component.scss',
})
export class LocalForm {
  private readonly service = inject(LocalService);
  private readonly cepApi = inject(CepService);

  /**
   * Último CEP para o qual a consulta já foi resolvida. Guardado como campo simples, não signal,
   * porque só serve para evitar reconsulta — não deve provocar recálculo de nada.
   */
  private ultimoCepConsultado = '';

  /** Visibilidade do painel (two-way com o pai). */
  readonly visivel = model<boolean>(false);
  /** Local em edição; `null` cadastra um novo. */
  readonly local = input<Local | null>(null);
  /** Emitido quando um local é salvo (criado ou editado). */
  readonly salvo = output<Local>();

  protected readonly tipos = TIPOS_LOCAL;
  protected readonly ufs = UFS;

  protected readonly nome = signal('');
  protected readonly tipo = signal<TipoLocal | null>(null);
  /** Valor exibido no campo, com máscara. A fonte de verdade do CEP é {@link cep}. */
  protected readonly cepMascarado = signal('');
  protected readonly rua = signal('');
  protected readonly numero = signal('');
  protected readonly complemento = signal('');
  protected readonly bairro = signal('');
  protected readonly cidade = signal('');
  protected readonly uf = signal<Uf | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly salvando = signal(false);
  /** Aviso da consulta de CEP (não encontrado ou indisponível). Nunca impede o cadastro. */
  protected readonly avisoCep = signal<string | null>(null);
  protected readonly consultandoCep = signal(false);

  /**
   * Oito dígitos, derivados do valor com máscara. Derivar em vez de consumir `onUnmaskedChange`
   * porque aquele evento não dispara em atribuição programática — na edição, o CEP pré-preenchido
   * nunca chegaria ao modelo e salvar ficaria travado com o formulário visivelmente completo.
   */
  protected readonly cep = computed(() => this.cepMascarado().replace(/\D/g, ''));

  /** Salvar só habilita com os obrigatórios completos; complemento fica de fora (FR-002, FR-025). */
  protected readonly salvarDesabilitado = computed(
    () =>
      !this.nome().trim() ||
      !this.tipo() ||
      this.cep().length !== 8 ||
      !this.rua().trim() ||
      !this.numero().trim() ||
      !this.bairro().trim() ||
      !this.cidade().trim() ||
      !this.uf(),
  );

  protected readonly titulo = computed(() => (this.local() ? 'Editar local' : 'Novo local'));

  /**
   * Trilha sem links: o `form-drawer` vive em `widget/` e não deve depender do roteador. A
   * navegação continua pela sidebar; aqui a trilha comunica onde o formulário está.
   */
  protected readonly trilha = computed<MenuItem[]>(() => [
    { label: 'Home' },
    { label: 'Locais' },
    { label: this.local() ? 'Editar' : 'Novo' },
  ]);

  constructor() {
    // Ao abrir o painel, (re)preenche a partir do local em edição ou zera para novo.
    effect(() => {
      if (this.visivel()) {
        const alvo = this.local();
        this.nome.set(alvo?.nome ?? '');
        this.tipo.set(alvo?.tipo ?? null);
        this.cepMascarado.set(alvo?.cep ?? '');
        this.rua.set(alvo?.rua ?? '');
        this.numero.set(alvo?.numero ?? '');
        this.complemento.set(alvo?.complemento ?? '');
        this.bairro.set(alvo?.bairro ?? '');
        this.cidade.set(alvo?.cidade ?? '');
        this.uf.set(alvo?.uf ?? null);
        this.erro.set(null);
        this.avisoCep.set(null);
        // Marca o CEP carregado como já resolvido: abrir em edição não deve disparar consulta e
        // sobrescrever com a versão do provedor um endereço que o Gestor pode ter corrigido.
        this.ultimoCepConsultado = alvo?.cep ?? '';
      }
    });

    // Consulta quando o CEP fica completo e é diferente do último já resolvido (FR-010, FR-014).
    effect(() => {
      const cep = this.cep();
      if (cep.length !== 8 || cep === this.ultimoCepConsultado) {
        return;
      }
      this.ultimoCepConsultado = cep;
      this.consultarCep(cep);
    });
  }

  private consultarCep(cep: string): void {
    this.avisoCep.set(null);
    this.consultandoCep.set(true);

    this.cepApi.consultar(cep).subscribe((resultado) => {
      this.consultandoCep.set(false);

      switch (resultado.situacao) {
        case 'encontrado':
          this.rua.set(resultado.rua);
          this.bairro.set(resultado.bairro);
          this.cidade.set(resultado.cidade);
          if (resultado.uf) {
            this.uf.set(resultado.uf);
          }
          break;
        case 'nao-encontrado':
          this.avisoCep.set('CEP não encontrado. Preencha o endereço manualmente.');
          break;
        case 'indisponivel':
          this.avisoCep.set(
            'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.',
          );
          break;
      }
    });
  }

  protected salvar(): void {
    if (this.salvarDesabilitado()) {
      return;
    }
    this.erro.set(null);
    this.salvando.set(true);

    const requisicao: LocalRequest = {
      nome: this.nome().trim(),
      tipo: this.tipo(),
      cep: this.cep(),
      rua: this.rua().trim(),
      numero: this.numero().trim(),
      complemento: this.complemento().trim() || null,
      bairro: this.bairro().trim(),
      cidade: this.cidade().trim(),
      uf: this.uf(),
    };

    const alvo = this.local();
    const operacao = alvo
      ? this.service.editar(alvo.id, requisicao)
      : this.service.criar(requisicao);

    operacao.subscribe({
      next: (local) => {
        this.salvando.set(false);
        this.salvo.emit(local);
        this.visivel.set(false);
      },
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível salvar. Verifique os dados e tente novamente.');
      },
    });
  }

  protected cancelar(): void {
    this.visivel.set(false);
  }
}
