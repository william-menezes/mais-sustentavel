import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router, provideRouter } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ColetaService } from '@domain/coleta/apis/coleta.api';
import { Coleta, ColetasDoPonto } from '@domain/coleta/interfaces/coleta.interface';
import { LocalService } from '@domain/local/apis/local.api';
import { Local } from '@domain/local/interfaces/local.interface';
import { PontoDetalhe } from './ponto-detalhe.component';
import { Ponto } from '../../interfaces/ponto.interface';
import { PontoService } from '../../apis/ponto.api';

/** Superfície interna lida pelos testes — os derivados são protegidos no componente. */
interface Interno {
  visivel: () => boolean;
  titulo: () => string;
  refCurta: () => string;
  urlDoQr: () => string;
  enderecoExibido: () => string;
  copiado: () => boolean;
  erroCopia: () => boolean;
  litrosFormatado: () => string;
  fundoSocialFormatado: () => string;
  mediaFormatada: () => string;
  historico: () => Coleta[];
  carregandoColetas: () => boolean;
  erroColetas: () => boolean;
  rotuloArquivamento: () => string;
  localVisivel: () => boolean;
  local: () => Local | null;
  carregandoLocal: () => boolean;
  erroLocal: () => boolean;
  dataBr: (iso: string) => string;
  copiar: () => Promise<void>;
  baixarQr: () => void;
  verLocal: () => void;
  registrarColeta: () => void;
  aoEditar: () => void;
  aoAlternarArquivamento: () => void;
  editar: { subscribe: (fn: (ponto: Ponto) => void) => void };
  arquivar: { subscribe: (fn: (ponto: Ponto) => void) => void };
  reativar: { subscribe: (fn: (ponto: Ponto) => void) => void };
}

const LOCAL: Local = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  nome: 'Condomínio Jardim das Acácias',
  tipo: 'CONDOMINIO',
  cep: '38408100',
  rua: 'Rua das Acácias',
  numero: '320',
  complemento: null,
  bairro: 'Santa Mônica',
  cidade: 'Uberlândia',
  uf: 'MG',
  arquivado: false,
  criadoEm: '2026-01-10T12:00:00',
};

const ESTACAO: Ponto = {
  id: '96e96ba8-1111-2222-3333-444444444444',
  localId: LOCAL.id,
  localNome: LOCAL.nome,
  referencia: 'Bloco B · garagem coberta',
  // Endereço público completo: é o que a ação de copiar precisa entregar, não o que a tela exibe.
  qrConteudo: 'https://sustentavel.app/p/96e96ba8-1111-2222-3333-444444444444',
  qrImagemUrl: '/api/pontos/96e96ba8-1111-2222-3333-444444444444/qr',
  arquivado: false,
  criadoEm: '2026-06-01T12:00:00',
};

/** Estação do acervo anterior à V7: sem referência, e sem rótulo inventado no lugar (FR-012). */
const SEM_REFERENCIA: Ponto = { ...ESTACAO, referencia: null };

function coleta(parcial: Partial<Coleta> = {}): Coleta {
  return {
    id: 'c-1',
    pontoId: ESTACAO.id,
    litrosReais: 30,
    data: '2026-07-11',
    coletorNome: 'Marina Alves',
    criadoEm: '2026-07-11T09:30:00',
    ...parcial,
  };
}

describe('PontoDetalhe', () => {
  let coletaFake: { listar: ReturnType<typeof vi.fn> };
  let pontoFake: { qrUrl: ReturnType<typeof vi.fn>; listar: ReturnType<typeof vi.fn> };
  let localFake: { listar: ReturnType<typeof vi.fn> };

  function abrir(
    opcoes: {
      ponto?: Ponto | null;
      coletas?: ColetasDoPonto | 'falha';
      ativos?: Local[] | 'falha';
      arquivados?: Local[] | 'falha';
      visivel?: boolean;
    } = {},
  ): { fixture: ComponentFixture<PontoDetalhe>; comp: Interno } {
    const coletas = opcoes.coletas ?? { totalLitros: 0, coletas: [] };
    coletaFake = {
      listar: vi
        .fn()
        .mockReturnValue(coletas === 'falha' ? throwError(() => new Error('fora')) : of(coletas)),
    };
    pontoFake = {
      qrUrl: vi.fn((id: string) => `/api/pontos/${id}/qr`),
      // A ficha do Local, aberta empilhada, lista os pontos daquele local.
      listar: vi.fn().mockReturnValue(of([])),
    };
    const ativos = opcoes.ativos ?? [LOCAL];
    const arquivados = opcoes.arquivados ?? [];
    localFake = {
      listar: vi.fn((arquivado = false) => {
        const resposta = arquivado ? arquivados : ativos;
        return resposta === 'falha' ? throwError(() => new Error('fora')) : of(resposta);
      }),
    };

    TestBed.configureTestingModule({
      imports: [PontoDetalhe],
      providers: [
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura } }),
        provideRouter([]),
        { provide: ColetaService, useValue: coletaFake },
        { provide: PontoService, useValue: pontoFake },
        { provide: LocalService, useValue: localFake },
        // A ficha do Local traz o painel de novo ponto, que injeta MessageService mesmo fechado.
        MessageService,
      ],
    });

    const fixture = TestBed.createComponent(PontoDetalhe);
    fixture.componentRef.setInput('ponto', 'ponto' in opcoes ? opcoes.ponto : ESTACAO);
    fixture.componentRef.setInput('visivel', opcoes.visivel ?? true);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as unknown as Interno };
  }

  /**
   * O Intl separa "R$" do número com espaço fino insecável (U+202F ou U+00A0); comparar com um
   * espaço comum exige normalizar. `\s` cobre os dois sem depender de caracteres invisíveis no
   * código-fonte, que sobrevivem mal a copiar e colar.
   */
  function semEspacoRigido(texto: string): string {
    return texto.replace(/\s+/g, ' ');
  }

  /** Instala uma área de transferência controlada no navegador de teste. */
  function comAreaDeTransferencia(recusar = false): ReturnType<typeof vi.fn> {
    const writeText = vi.fn(() =>
      recusar ? Promise.reject(new Error('negado')) : Promise.resolve(),
    );
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    return writeText;
  }

  afterEach(() => {
    // Sem isto a área de transferência de um teste vazaria para o seguinte.
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  // ---------- cabeçalho ----------

  it('usa a referência da estação como título', () => {
    const { comp } = abrir();

    expect(comp.titulo()).toBe('Bloco B · garagem coberta');
  });

  it('usa a referência curta como título quando a estação não tem referência', () => {
    // Nenhum rótulo é inventado para o acervo anterior à V7 (FR-013): a identificação de reserva é
    // o próprio identificador abreviado, que o Gestor já usa para citar uma estação.
    const { comp } = abrir({ ponto: SEM_REFERENCIA });

    expect(comp.titulo()).toBe('96e96ba8');
  });

  it('cai na referência curta quando a referência é só espaço em branco', () => {
    const { comp } = abrir({ ponto: { ...ESTACAO, referencia: '   ' } });

    expect(comp.titulo()).toBe('96e96ba8');
  });

  it('mostra o local e a situação ativa como etiquetas', () => {
    const { fixture } = abrir();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Condomínio Jardim das Acácias');
    expect(texto).toContain('Ativo');
  });

  it('mostra a situação arquivada quando a estação está arquivada', () => {
    const { fixture } = abrir({ ponto: { ...ESTACAO, arquivado: true } });

    expect(fixture.nativeElement.textContent as string).toContain('Arquivado');
  });

  // ---------- bloco do QR ----------

  it('mostra a imagem do QR, a referência curta e o endereço público', () => {
    const { fixture, comp } = abrir();
    const imagem = fixture.nativeElement.querySelector('[data-testid="qr-imagem"]') as HTMLImageElement;

    expect(comp.urlDoQr()).toBe('/api/pontos/96e96ba8-1111-2222-3333-444444444444/qr');
    expect(imagem.getAttribute('src')).toContain('/api/pontos/');
    expect(comp.refCurta()).toBe('96e96ba8');
    expect(fixture.nativeElement.textContent as string).toContain('sustentavel.app/p/96e96ba8');
  });

  it('copia o qrConteudo completo, nunca o texto exibido abreviado', async () => {
    // O exibido é o endereço truncado no identificador; copiá-lo entregaria um link que não abre.
    const escrever = comAreaDeTransferencia();
    const { comp } = abrir();
    expect(comp.enderecoExibido()).not.toBe(ESTACAO.qrConteudo);

    await comp.copiar();

    expect(escrever).toHaveBeenCalledWith(ESTACAO.qrConteudo);
    expect(comp.copiado()).toBe(true);
    expect(comp.erroCopia()).toBe(false);
  });

  it('mantém o endereço na tela e avisa quando a área de transferência recusa', async () => {
    const escrever = comAreaDeTransferencia(true);
    const { fixture, comp } = abrir();

    await comp.copiar();
    fixture.detectChanges();

    expect(escrever).toHaveBeenCalled();
    expect(comp.erroCopia()).toBe(true);
    expect(comp.copiado()).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-testid="copia-erro"]')).toBeTruthy();
    // O endereço aparece inteiro para seleção manual: abreviado, copiar à mão daria um link quebrado.
    const endereco = fixture.nativeElement.querySelector('[data-testid="endereco"]') as HTMLElement;
    expect(endereco.textContent).toContain(ESTACAO.qrConteudo);
  });

  it('avisa quando a área de transferência não está disponível', async () => {
    // Exige contexto seguro; falhar em silêncio faria colar o conteúdo anterior sem perceber.
    const { comp } = abrir();

    await comp.copiar();

    expect(comp.erroCopia()).toBe(true);
    expect(comp.copiado()).toBe(false);
  });

  it('baixa o QR com a referência curta no nome do arquivo', () => {
    const { comp } = abrir();
    const ancora = document.createElement('a');
    const clicar = vi.spyOn(ancora, 'click').mockImplementation(() => undefined);
    const criar = vi.spyOn(document, 'createElement') as unknown as {
      mockReturnValue: (valor: HTMLAnchorElement) => void;
      mockRestore: () => void;
    };
    criar.mockReturnValue(ancora);

    comp.baixarQr();
    criar.mockRestore();

    expect(ancora.download).toBe('qr-96e96ba8.png');
    expect(ancora.href).toContain('/api/pontos/96e96ba8-1111-2222-3333-444444444444/qr');
    expect(clicar).toHaveBeenCalled();
  });

  // ---------- indicadores ----------

  it('mostra o total de litros que veio do servidor, sem somar no cliente', () => {
    // As parcelas somam 70 de propósito: o total é `totalLitros`, calculado em BigDecimal no
    // servidor (research D5). Somar aqui reintroduziria erro de ponto flutuante.
    const { comp } = abrir({
      coletas: {
        totalLitros: 90,
        coletas: [coleta({ id: 'a', litrosReais: 30 }), coleta({ id: 'b', litrosReais: 40 })],
      },
    });

    expect(comp.litrosFormatado()).toBe('90 L');
  });

  it('calcula o fundo social a R$ 1,00 por litro real', () => {
    const { comp } = abrir({ coletas: { totalLitros: 1842, coletas: [coleta()] } });

    expect(semEspacoRigido(comp.fundoSocialFormatado())).toBe('R$ 1.842');
  });

  it('calcula a média como o total dividido pela quantidade de coletas', () => {
    const { comp } = abrir({
      coletas: {
        totalLitros: 90,
        coletas: [coleta({ id: 'a' }), coleta({ id: 'b' }), coleta({ id: 'c' })],
      },
    });

    expect(comp.mediaFormatada()).toBe('30 L');
  });

  it('arredonda a média só para exibir', () => {
    const { comp } = abrir({
      coletas: {
        totalLitros: 100,
        coletas: [coleta({ id: 'a' }), coleta({ id: 'b' }), coleta({ id: 'c' })],
      },
    });

    expect(comp.mediaFormatada()).toBe('33,3 L');
  });

  it('mostra ausência na média, nunca zero, quando a estação não tem coleta', () => {
    // Zero afirmaria que as coletas vieram vazias (FR-034). Total e fundo social zerados são o
    // dado correto; média de nenhuma coleta não existe.
    const { comp } = abrir({ coletas: { totalLitros: 0, coletas: [] } });

    expect(comp.litrosFormatado()).toBe('0 L');
    expect(semEspacoRigido(comp.fundoSocialFormatado())).toBe('R$ 0');
    expect(comp.mediaFormatada()).toBe('—');
    expect(comp.mediaFormatada()).not.toContain('0');
  });

  it('mostra traço nos três indicadores quando a consulta de coletas falha', () => {
    const { comp } = abrir({ coletas: 'falha' });

    expect(comp.litrosFormatado()).toBe('—');
    expect(comp.fundoSocialFormatado()).toBe('—');
    expect(comp.mediaFormatada()).toBe('—');
  });

  // ---------- histórico ----------

  it('lista cada coleta com data, quem coletou e litros', () => {
    const { fixture } = abrir({
      coletas: { totalLitros: 30, coletas: [coleta({ coletorNome: 'Marina Alves' })] },
    });
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('11/07/2026');
    expect(texto).toContain('Marina Alves');
    expect(texto).toContain('30 L');
  });

  it('formata a data sem deslocar o dia pelo fuso', () => {
    // `data` é ISO só de dia; interpretá-la como instante UTC voltaria um dia em Brasília.
    const { comp } = abrir();

    expect(comp.dataBr('2026-07-11')).toBe('11/07/2026');
  });

  it('ordena o histórico da coleta mais recente para a mais antiga', () => {
    const { comp } = abrir({
      coletas: {
        totalLitros: 90,
        coletas: [
          coleta({ id: 'a', data: '2026-05-02' }),
          coleta({ id: 'b', data: '2026-07-11' }),
          coleta({ id: 'c', data: '2026-06-20' }),
        ],
      },
    });

    expect(comp.historico().map((item) => item.data)).toEqual([
      '2026-07-11',
      '2026-06-20',
      '2026-05-02',
    ]);
  });

  it('indica a ausência do coletor sem apagar data e litros', () => {
    // Espaço vazio pareceria falha de carregamento (FR-036).
    const { fixture } = abrir({
      coletas: { totalLitros: 30, coletas: [coleta({ coletorNome: null })] },
    });
    const ausente = fixture.nativeElement.querySelector('[data-testid="coletor-ausente"]');

    expect(ausente).toBeTruthy();
    expect((ausente.textContent as string).toLowerCase()).toContain('não informado');
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('11/07/2026');
    expect(texto).toContain('30 L');
  });

  it('avisa quando a estação ainda não tem coleta', () => {
    const { fixture } = abrir({ coletas: { totalLitros: 0, coletas: [] } });

    expect(fixture.nativeElement.querySelector('[data-testid="historico-vazio"]')).toBeTruthy();
  });

  it('degrada só a seção do histórico quando a consulta falha', () => {
    const { fixture, comp } = abrir({ coletas: 'falha' });
    const raiz = fixture.nativeElement as HTMLElement;

    expect(comp.erroColetas()).toBe(true);
    expect(comp.carregandoColetas()).toBe(false);
    expect(comp.visivel()).toBe(true);
    expect(raiz.querySelector('[data-testid="historico-erro"]')).toBeTruthy();
    // O resto da ficha continua utilizável: QR, endereço e ações seguem na tela (SC-012).
    expect(raiz.querySelector('[data-testid="qr-imagem"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="endereco"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="editar"]')).toBeTruthy();
    expect(raiz.textContent as string).toContain('Bloco B · garagem coberta');
  });

  it('faz uma única consulta de coletas para alimentar os três indicadores e o histórico', () => {
    abrir({
      coletas: {
        totalLitros: 90,
        coletas: [coleta({ id: 'a' }), coleta({ id: 'b' }), coleta({ id: 'c' })],
      },
    });

    expect(coletaFake.listar).toHaveBeenCalledTimes(1);
    expect(coletaFake.listar).toHaveBeenCalledWith(ESTACAO.id);
  });

  it('não consulta coletas com o painel fechado', () => {
    abrir({ visivel: false });

    expect(coletaFake.listar).not.toHaveBeenCalled();
  });

  // ---------- rodapé ----------

  it('projeta o próprio rodapé no lugar dos botões de formulário', () => {
    // Guarda de regressão do slot `[acoes]`: o seletor casa com nós estáticos, e um `@if` em volta
    // do `<div acoes>` o empacotaria num `ng-template` que cairia no corpo — trazendo de volta
    // Cancelar/Salvar, ações que não existem numa tela de leitura.
    const { fixture } = abrir();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('[data-testid="alternar-arquivamento"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="editar"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="ver-local"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="registrar-coleta"]')).toBeTruthy();
    expect(raiz.querySelector('[data-testid="salvar"]')).toBeFalsy();
    expect(raiz.querySelector('[data-testid="cancelar"]')).toBeFalsy();
  });

  it('mostra o X de fechar, única saída sem Cancelar no rodapé', () => {
    const { fixture } = abrir();

    expect(fixture.nativeElement.querySelector('.p-drawer-close-button')).toBeTruthy();
  });

  it('desabilita as ações do rodapé sem estação', () => {
    const { fixture } = abrir({ ponto: null });
    const editar = fixture.nativeElement.querySelector('[data-testid="editar"]') as HTMLButtonElement;

    expect(editar.disabled).toBe(true);
  });

  // Os dois rótulos ficam em testes separados porque cada `abrir` configura o próprio TestBed, que
  // não aceita reconfiguração depois de instanciar um componente.

  it('oferece arquivar para estação ativa', () => {
    const { comp } = abrir();

    expect(comp.rotuloArquivamento()).toBe('Arquivar estação');
  });

  it('oferece reativar para estação arquivada', () => {
    const { comp } = abrir({ ponto: { ...ESTACAO, arquivado: true } });

    expect(comp.rotuloArquivamento()).toBe('Reativar estação');
  });

  it('emite editar e fecha a ficha', () => {
    // Recebendo a estação por input (research D13), a ficha exibiria a referência antiga depois da
    // edição — melhor sair do que mostrar dado velho.
    const { comp } = abrir();
    let emitido: Ponto | undefined;
    comp.editar.subscribe((ponto) => (emitido = ponto));

    comp.aoEditar();

    expect(emitido).toEqual(ESTACAO);
    expect(comp.visivel()).toBe(false);
  });

  it('emite arquivar para estação ativa e fecha a ficha', () => {
    const { comp } = abrir();
    let arquivou: Ponto | undefined;
    let reativou: Ponto | undefined;
    comp.arquivar.subscribe((ponto) => (arquivou = ponto));
    comp.reativar.subscribe((ponto) => (reativou = ponto));

    comp.aoAlternarArquivamento();

    expect(arquivou).toEqual(ESTACAO);
    expect(reativou).toBeUndefined();
    expect(comp.visivel()).toBe(false);
  });

  it('emite reativar para estação arquivada', () => {
    const alvo = { ...ESTACAO, arquivado: true };
    const { comp } = abrir({ ponto: alvo });
    let arquivou: Ponto | undefined;
    let reativou: Ponto | undefined;
    comp.arquivar.subscribe((ponto) => (arquivou = ponto));
    comp.reativar.subscribe((ponto) => (reativou = ponto));

    comp.aoAlternarArquivamento();

    expect(reativou).toEqual(alvo);
    expect(arquivou).toBeUndefined();
  });

  it('leva ao registro de coleta da estação, sem reimplementar o formulário', () => {
    const { comp } = abrir();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    comp.registrarColeta();

    expect(navegar).toHaveBeenCalledWith(['/pontos', ESTACAO.id, 'coletas']);
  });

  it('abre a ficha do Local empilhada, sem fechar a da estação', () => {
    const { fixture, comp } = abrir();
    expect(document.querySelectorAll('.p-drawer').length).toBe(1);
    const antes = localFake.listar.mock.calls.length;

    comp.verLocal();
    const idas = localFake.listar.mock.calls.length - antes;
    fixture.detectChanges();

    // Uma ida só quando o local está entre os ativos, que é o caso comum.
    expect(idas).toBe(1);
    expect(comp.local()).toEqual(LOCAL);
    expect(comp.localVisivel()).toBe(true);
    expect(comp.visivel()).toBe(true);
    // Contar painéis no DOM é o que prova o empilhamento: o de cima acrescenta uma camada.
    expect(document.querySelectorAll('.p-drawer').length).toBe(2);
  });

  it('busca o local entre os arquivados quando ele não está na lista de ativos', () => {
    // Estação cujo local foi arquivado depois continua vinculada a ele (RN-G-05).
    const arquivado = { ...LOCAL, arquivado: true };
    const { comp } = abrir({ ativos: [], arquivados: [arquivado] });
    // Contagem relativa: a ficha do Local, quando montada, traz um painel que também consulta
    // locais. Contar o total prenderia este teste à implementação de outro componente.
    const antes = localFake.listar.mock.calls.length;

    comp.verLocal();

    expect(localFake.listar.mock.calls.length - antes).toBe(2);
    expect(localFake.listar).toHaveBeenCalledWith(true);
    expect(comp.local()).toEqual(arquivado);
    expect(comp.localVisivel()).toBe(true);
  });

  it('não repete a busca do local ao reabrir a ficha dele', () => {
    const { comp } = abrir();

    comp.verLocal();
    const depoisDaPrimeira = localFake.listar.mock.calls.length;
    comp.verLocal();

    expect(localFake.listar.mock.calls.length).toBe(depoisDaPrimeira);
  });

  it('avisa quando não consegue carregar o local, sem abrir painel vazio', () => {
    const { fixture, comp } = abrir({ ativos: 'falha' });

    comp.verLocal();
    fixture.detectChanges();

    expect(comp.erroLocal()).toBe(true);
    expect(comp.localVisivel()).toBe(false);
    expect(comp.carregandoLocal()).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-testid="local-erro"]')).toBeTruthy();
    // A ficha da estação segue utilizável.
    expect(comp.visivel()).toBe(true);
  });

  it('não emite ação nenhuma sem estação', () => {
    const { comp } = abrir({ ponto: null });
    let emitiu = false;
    comp.editar.subscribe(() => (emitiu = true));
    comp.arquivar.subscribe(() => (emitiu = true));
    comp.reativar.subscribe(() => (emitiu = true));
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    comp.aoEditar();
    comp.aoAlternarArquivamento();
    comp.registrarColeta();
    comp.verLocal();

    expect(emitiu).toBe(false);
    expect(navegar).not.toHaveBeenCalled();
    expect(comp.localVisivel()).toBe(false);
    expect(coletaFake.listar).not.toHaveBeenCalled();
  });
});
