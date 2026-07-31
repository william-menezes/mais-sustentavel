import { Translation } from 'primeng/api';

/**
 * Tradução dos rótulos internos do PrimeNG para português brasileiro (Art. 8.1 / FR-027).
 *
 * <p>Rótulos que a biblioteca gera sozinha — botões do menu de filtro, nomes dos modos de
 * comparação, mensagens de lista vazia, nomes de mês — não passam pelos nossos templates, então a
 * única forma de traduzi-los é esta. O que escrevemos à mão continua em pt-BR direto no template.
 *
 * <p><b>O objeto é deliberadamente completo, e `aria` precisa vir inteiro.</b> O `providePrimeNG`
 * delega a `setTranslation`, que faz `{ ...padrão, ...nosso }` — merge de **um nível só**. Uma chave
 * de topo que falte cai no inglês (degradação visível, mas inofensiva); já um `aria` parcial
 * **substitui o objeto inteiro** e transforma todos os rótulos de acessibilidade não listados em
 * `undefined`. Seria uma regressão silenciosa de leitor de tela, invisível na tela. O
 * `pt-br.translation.spec.ts` compara chave por chave com o padrão da versão instalada justamente
 * para que uma atualização do PrimeNG não abra esse buraco sem ninguém notar.
 */
export const TRADUCAO_PT_BR: Translation = {
  // Modos de comparação dos filtros de coluna — os que aparecem no menu de funil da tabela.
  startsWith: 'Começa com',
  contains: 'Contém',
  notContains: 'Não contém',
  endsWith: 'Termina com',
  equals: 'Igual a',
  notEquals: 'Diferente de',
  noFilter: 'Sem filtro',
  lt: 'Menor que',
  lte: 'Menor ou igual a',
  gt: 'Maior que',
  gte: 'Maior ou igual a',
  is: 'É',
  isNot: 'Não é',
  before: 'Antes de',
  after: 'Depois de',
  dateIs: 'Data é',
  dateIsNot: 'Data não é',
  dateBefore: 'Data é antes de',
  dateAfter: 'Data é depois de',

  // Ações do menu de filtro.
  clear: 'Limpar',
  apply: 'Aplicar',
  /**
   * "Match All" e "Match Any" combinam as condições de um filtro. A tradução literal
   * ("Corresponder a todos") não diz *a todos os quê*; nomear a condição resolve a ambiguidade no
   * único lugar onde o rótulo aparece.
   */
  matchAll: 'Todas as condições',
  matchAny: 'Qualquer condição',
  addRule: 'Adicionar regra',
  removeRule: 'Remover regra',

  // Confirmação e envio de arquivo.
  accept: 'Sim',
  reject: 'Não',
  choose: 'Escolher',
  upload: 'Enviar',
  cancel: 'Cancelar',
  pending: 'Pendente',
  completed: 'Concluído',
  fileChosenMessage: 'Arquivos',
  noFileChosenMessage: 'Nenhum arquivo escolhido',
  // Unidades de tamanho: sigla internacional, igual em pt-BR.
  fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],

  // Calendário.
  dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  /** Dia antes do mês — o padrão da biblioteca é `mm/dd/yy`, que aqui seria lido errado. */
  dateFormat: 'dd/mm/yy',
  /** Domingo. Calendário brasileiro começa no domingo, então o `0` do padrão já está certo. */
  firstDayOfWeek: 0,
  today: 'Hoje',
  weekHeader: 'Sem',
  chooseYear: 'Escolher ano',
  chooseMonth: 'Escolher mês',
  chooseDate: 'Escolher data',
  prevDecade: 'Década anterior',
  nextDecade: 'Próxima década',
  prevYear: 'Ano anterior',
  nextYear: 'Próximo ano',
  prevMonth: 'Mês anterior',
  nextMonth: 'Próximo mês',
  prevHour: 'Hora anterior',
  nextHour: 'Próxima hora',
  prevMinute: 'Minuto anterior',
  nextMinute: 'Próximo minuto',
  prevSecond: 'Segundo anterior',
  nextSecond: 'Próximo segundo',
  am: 'am',
  pm: 'pm',

  // Força da senha.
  weak: 'Fraca',
  medium: 'Média',
  strong: 'Forte',
  passwordPrompt: 'Digite uma senha',

  // Listas e buscas.
  emptyMessage: 'Nenhum resultado encontrado',
  emptyFilterMessage: 'Nenhum resultado encontrado',
  emptySearchMessage: 'Nenhum resultado encontrado',
  emptySelectionMessage: 'Nenhum item selecionado',
  /**
   * Anúncio de leitor de tela, com `{0}` trocado pela quantidade de resultados. O padrão em inglês
   * ("Search results are available") não usa o marcador, e o componente faz a substituição de todo
   * jeito — aproveitamos para informar o número.
   */
  searchMessage: '{0} resultados disponíveis',
  selectionMessage: '{0} itens selecionados',

  /**
   * Rótulos de acessibilidade. Precisam estar todos aqui: o merge é raso, então este objeto
   * substitui o do PrimeNG por inteiro, e o que faltar viraria `undefined` para o leitor de tela.
   */
  aria: {
    trueLabel: 'Verdadeiro',
    falseLabel: 'Falso',
    nullLabel: 'Não selecionado',
    star: '1 estrela',
    stars: '{star} estrelas',
    selectAll: 'Todos os itens selecionados',
    unselectAll: 'Todos os itens desmarcados',
    close: 'Fechar',
    previous: 'Anterior',
    next: 'Próximo',
    navigation: 'Navegação',
    scrollTop: 'Rolar para o topo',
    moveTop: 'Mover para o topo',
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    moveBottom: 'Mover para o fim',
    moveToTarget: 'Mover para o destino',
    moveToSource: 'Mover para a origem',
    moveAllToTarget: 'Mover todos para o destino',
    moveAllToSource: 'Mover todos para a origem',
    // Marcador puro: o componente troca por número. Traduzir aqui quebraria a substituição.
    pageLabel: '{page}',
    firstPageLabel: 'Primeira página',
    lastPageLabel: 'Última página',
    nextPageLabel: 'Próxima página',
    prevPageLabel: 'Página anterior',
    rowsPerPageLabel: 'Linhas por página',
    previousPageLabel: 'Página anterior',
    jumpToPageDropdownLabel: 'Ir para a página',
    jumpToPageInputLabel: 'Número da página',
    selectRow: 'Linha selecionada',
    unselectRow: 'Linha desmarcada',
    expandRow: 'Linha expandida',
    collapseRow: 'Linha recolhida',
    expand: 'Expandir',
    collapse: 'Recolher',
    showFilterMenu: 'Mostrar menu de filtro',
    hideFilterMenu: 'Ocultar menu de filtro',
    filterOperator: 'Operador do filtro',
    filterConstraint: 'Condição do filtro',
    editRow: 'Editar linha',
    saveEdit: 'Salvar edição',
    cancelEdit: 'Cancelar edição',
    listView: 'Visualização em lista',
    gridView: 'Visualização em grade',
    // "Slide" é usado como está em pt-BR; `slideNumber` é marcador puro.
    slide: 'Slide',
    slideNumber: '{slideNumber}',
    zoomImage: 'Ampliar imagem',
    zoomIn: 'Aproximar',
    zoomOut: 'Afastar',
    rotateRight: 'Girar à direita',
    rotateLeft: 'Girar à esquerda',
    listLabel: 'Lista de opções',
    selectColor: 'Selecionar uma cor',
    removeLabel: 'Remover',
    browseFiles: 'Procurar arquivos',
    maximizeLabel: 'Maximizar',
    minimizeLabel: 'Minimizar',
  },
};
