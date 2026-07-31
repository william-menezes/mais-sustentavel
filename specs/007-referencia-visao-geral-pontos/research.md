# Fase 0 — Pesquisa e decisões: Referência da estação e visão geral de Pontos

Todas as incógnitas técnicas resolvidas antes do desenho. Nenhum `NEEDS CLARIFICATION` pendente.

---

## D1 — Coluna `referencia`: nullable, com limite por CHECK

**Decisão.** A migração `V7` acrescenta `referencia text` **nullable** à tabela `ponto`, com
`check (referencia is null or char_length(referencia) <= 60)`. Fase *expand* apenas; nenhum
endurecimento agora.

**Justificativa.** Mesma situação da V6: as estações já cadastradas não têm referência, e não existe
valor verdadeiro para preencher. Aqui a consequência de um sentinela é pior que no endereço — a
referência é o **título do cartão e do painel**, então um "estação 1" inventado apareceria como o nome
da coisa em toda a interface, e eventualmente no adesivo impresso. A ausência é informação
verdadeira, e a tela a trata exibindo a referência curta do identificador (FR-013).

`text` + CHECK em vez de `varchar(60)`: é o padrão que a V6 já usou para a lista fechada de UF
(`local_uf_check`), todas as colunas de texto do schema são `text`, e evita que uma divergência de
tamanho entre `@Column(length)` e a coluna real esbarre no `ddl-auto: validate`.

**Alternativas rejeitadas.**
- `NOT NULL` com sentinela: mente sobre o dado, e a mentira fica no título da tela.
- `NOT NULL` com a migração falhando se houver linhas: inviabiliza `mvn verify` em base com dados.
- Apagar as estações sem referência: destrói QR já impresso e coletas já registradas — viola RN-G-06.
- `varchar(60)`: funcionaria, mas foge do padrão do schema sem ganho.

**Fila de trabalho.** A V7 termina com um comentário trazendo a consulta das estações a completar,
como a V6 fez:
`select id, local_id from ponto where referencia is null;`

---

## D2 — Coleção global de pontos: `GET /api/pontos`

**Decisão.** Endpoint novo, com parâmetro `arquivados` (padrão `false`), devolvendo **todas** as
estações com `referencia` e `localNome`, ordenadas por nome do local e, dentro dele, por referência.
Sem paginação.

**Justificativa.** A tela precisa de estações de vários locais na mesma lista (FR-001) e hoje só existe
a coleção aninhada `GET /api/locais/{localId}/pontos`. Montar a lista global no cliente exigiria uma
consulta por local — o N+1 que esta feature evita em dois lugares.

A ordenação vem do servidor porque é ordenação estável de domínio (agrupar estações do mesmo local),
não preferência de apresentação. Deixá-la no cliente obrigaria a repeti-la nos dois modos de
visualização.

Sem paginação: a operação tem dezenas de estações, e a filtragem é no cliente como em Locais. Se a
escala mudar, o endpoint aceita paginação depois sem quebrar o contrato.

**A coleção aninhada permanece.** Não é código morto: a ficha do Local (`local-detalhe`, feature 006)
consome `GET /api/locais/{localId}/pontos` para listar os pontos daquele local. Ela ganha `referencia`
e `localNome` de graça, porque as duas coleções compartilham o mesmo `PontoResponse`.

**Alternativa rejeitada.** DTO separado para a listagem global (`PontoNaListaResponse`): duplicaria seis
campos idênticos para acrescentar dois, e a coleção aninhada também quer a referência.

---

## D3 — Edição da referência: `PUT /api/pontos/{id}`, sem trocar de local

**Decisão.** `PUT /api/pontos/{id}` com corpo `{ referencia }`. O local **não** é aceito no corpo e não
pode ser alterado.

**Justificativa.** A referência é o único campo editável de uma estação. `PUT` com a representação
editável completa é coerente com `PUT /api/locais/{id}`, que a CA-01 já estabeleceu.

Recusar a troca de local não é limitação de escopo, é **invariante**: a RN-G-05 diz que o ponto
permanece vinculado ao local, e o QR já impresso e colado na parede aponta para uma estação que o
morador associa àquele endereço. Mover a estação de local reescreveria o histórico de coletas de dois
locais — inclusive o valor social já publicado. Quem errou o local cadastra outra estação e arquiva a
errada; o histórico dos dois fica correto.

**Alternativa rejeitada.** `PATCH`: seria mais literal para um campo só, mas o projeto não tem
precedente de PATCH e o corpo *é* a representação editável inteira — `PUT` não mente aqui.

---

## D4 — Obrigatoriedade da referência: no servidor, com corpo no cadastro

**Decisão.** `PontoRequest` com `@NotBlank` e `@Size(max = 60)` na referência. O cadastro
`POST /api/locais/{localId}/pontos`, que hoje não recebe corpo, passa a exigir um.

**Justificativa.** FR-018 e Art. 7.6: a obrigatoriedade tem de valer para quem contorna o formulário.
Manter o cadastro sem corpo deixaria aberta uma porta que cria estação anônima — exatamente o que a
feature existe para eliminar.

O `PontoService` **normaliza antes de validar o que já entrou**: `trim` na referência (FR-016) e
transformação de string em branco em recusa, não em `null`. Isso importa porque a coluna aceita `null`
para o acervo antigo — sem a normalização, um cadastro novo com `"   "` viraria um `null` legítimo e
furaria a obrigatoriedade por dentro.

**Consequência registrada.** É mudança incompatível no contrato, listada em Complexity Tracking do
plano. O único consumidor é o frontend deste repositório, publicado no mesmo merge.

---

## D5 — Indicadores da ficha: derivados no cliente, do histórico

**Decisão.** A ficha faz **uma** consulta — `GET /api/pontos/{id}/coletas` — e deriva os três
indicadores dela: total de litros (soma), valor social (total × R$ 1,00, RN-G-02) e média por coleta
(total ÷ quantidade). Nenhum agregado novo no servidor.

**Justificativa.** O agregado por estação ficou fora de escopo por decisão do Gestor. Derivar do
histórico, que a ficha já precisa buscar, tem uma vantagem que não é consolo: **os números não podem
divergir do que está listado logo abaixo deles** — é o SC-007 satisfeito por construção, não por
coincidência de duas consultas.

**Precisão.** `litrosReais` é `BigDecimal` no servidor e chega como número em JSON. Somar em ponto
flutuante acumula erro. Com litros na casa das centenas e duas decimais, o desvio é muito abaixo do
que a exibição mostra; a formatação arredonda para exibir. Registrado como risco aceito, não como
não-problema: se o dia vier em que litros precisem fechar centavo a centavo com contabilidade, a soma
passa para o servidor.

**Média sem coleta.** Sem coletas, a média não existe. FR-034 proíbe exibir zero — zero afirmaria que
as coletas vieram vazias. Exibe marca de ausência, o mesmo tratamento que a 006 deu ao agregado
indisponível.

**Alternativa rejeitada.** Endpoint `/api/impacto/valor-social/por-ponto`: seria o caminho para mostrar
volume nos cartões, e é o que o Gestor decidiu adiar. Fica registrado como o próximo passo natural
quando VH-02 for entregue por inteiro.

---

## D6 — Cartões e tabela: uma tabela dona do estado, dois corpos

**Decisão.** Uma única `p-table` é a dona dos dados, do filtro e da ordenação nos **dois** modos. No
modo tabela, renderiza linhas. No modo cartões, o corpo renderiza uma linha com uma célula que contém a
grade de cartões, alimentada pelo `filteredValue` da própria tabela. O cabeçalho com os funis fica
visível nos dois modos.

**Justificativa.** FR-004 exige que os filtros sobrevivam à alternância. Com duas árvores
independentes, o estado de filtro teria de ser sincronizado à mão entre elas — e estado duplicado
diverge. Com a tabela sempre presente, não existe segundo estado para sincronizar: alternar troca
apenas como o corpo é desenhado.

**Desvio consciente das telas de referência.** O mock do modo cartões **não mostra controle de filtro
nenhum** — só o contador e a alternância. Mantemos os funis visíveis nos dois modos: esconder o filtro
em um deles tornaria aquele modo menos capaz sem motivo, e FR-005 pede filtro por coluna na tela, não
"em um dos modos da tela". Fica registrado como divergência deliberada do material de referência.

**Alternativas rejeitadas.**
- `p-dataview`, que tem alternância lista/grade nativa: perderia os filtros de coluna com menu de
  funil, que são componentes da `p-table` e são o padrão já estabelecido em `docs/design.md`.
- Dois componentes irmãos com o filtro na página: exigiria reimplementar o menu de funil por fora da
  tabela e sincronizar dois estados — mais código para um resultado pior.

**A lição da 006 se aplica aqui.** Em `filterDisplay="menu"` o estado de filtro de cada campo é um
**array de condições**, e a API imperativa `tabela.filter(valor, campo, modo)` grava a forma de linha —
um objeto único — que corrompe o painel do funil. O filtro inicial (situação em "ativo", e o local
quando a tela chega filtrada) é **declarado pelo binding de filtros**, nunca aplicado por chamada.

---

## D7 — Autocomplete de Local: filtro no cliente, sem consulta por tecla

**Decisão.** Ao abrir o cadastro de estação, o componente carrega uma vez os locais **ativos** e filtra
no cliente por nome e bairro, **ignorando acentos e caixa**. Sem resultado, o estado vazio oferece
"+ adicionar local".

**Justificativa.** A operação tem dezenas de locais. Uma consulta por tecla acrescentaria latência e
um endpoint de busca sem necessidade; um `select` com a lista inteira seria pior de usar do que digitar
três letras. Carregar uma vez cabe na memória e responde instantaneamente.

**Ignorar acentos é requisito, não refinamento.** "Uberlandia" tem de encontrar "Uberlândia", e
"Sao Jose" tem de encontrar "São José" — quem digita rápido não acentua. A comparação normaliza os dois
lados removendo diacríticos antes de comparar.

**Somente locais ativos** (FR-021): local arquivado não recebe estação nova, e oferecê-lo produziria
uma recusa do servidor logo depois — erro que a interface pode evitar em vez de traduzir.

**Alternativa rejeitada.** Endpoint de busca `GET /api/locais?busca=...`: útil em outra escala, mas
aqui acrescenta superfície de API para resolver um problema que o cliente já resolve.

---

## D8 — A tela de estações por local sai; nada dela se perde

**Decisão.** A rota `locais/:localId/pontos` e a página atual são removidas. `/pontos` passa a existir
e "Ver pontos" na linha do Local leva até lá **já filtrada** por aquele local, pelo binding de filtros
alimentado com o parâmetro da rota.

**Destino de cada recurso da tela removida** — a tabela existe para que a remoção seja verificável, não
uma promessa:

| Recurso da tela antiga | Para onde vai |
|---|---|
| Imagem do QR de cada ponto | Cartão da visão geral (miniatura) e ficha da estação (tamanho cheio) |
| Baixar o PNG do QR | Ficha da estação |
| Cadastrar ponto | Painel de cadastro, agora com local e referência |
| Arquivar / reativar | Menu da linha na visão geral e rodapé da ficha |
| Alternância "Ativos / Arquivados" | Filtro da coluna Situação, igual ao de Locais |
| Ver coletas do ponto | Ficha da estação, pela ação de registrar coleta (a rota de coletas continua) |
| Referência curta de oito caracteres | Cartão, tabela e ficha |
| Voltar para Locais | Trilha de navegação da própria visão geral |

**Justificativa.** Duas telas de estações divergiriam: filtros, colunas e ações evoluiriam em uma e não
na outra. E a global resolve o caso da aninhada — filtrar por um local — enquanto a aninhada não resolve
o caso da global.

**Risco.** Quem tiver a URL aninhada salva vai encontrar rota inexistente. Aceito: é área
administrativa autenticada, sem indexação nem link externo. Se incomodar, um redirecionamento resolve
depois em uma linha.

---

## D9 — Aviso de pendências: no rodapé do painel, texto fornecido pelo formulário

**Decisão.** O `form-drawer` ganha `pendencia = input<string>('')`, renderizado no rodapé **antes** do
slot de ações. Vale para o rodapé padrão e para os projetados, com uma implementação só.

**Justificativa.** As telas de referência frasearam de duas formas — "Falta preencher: tipo, CEP, rua,
número, bairro." e "Escolha o local do ponto." A primeira é lista de campos, a segunda é instrução. Um
painel que montasse a frase precisaria conhecer os campos de cada formulário, o que ele não conhece e
não deve. Texto livre mantém o painel ignorante de domínio, que é o motivo de ele viver em `widget/`.

Renderizar **antes** do slot de ações, e não dentro do rodapé padrão, é o que faz o recurso valer
também para a ficha e para o painel de ponto, que projetam rodapé próprio. Colocá-lo dentro do conteúdo
de reserva o deixaria disponível só para quem usa Cancelar/Salvar.

**Retrofit em Locais** (FR-051): o `local-form` passa a montar a lista dos obrigatórios em branco. Isso
revisa a decisão da 006 — que era deixar o botão apenas desabilitado — e a revisão é do Gestor, para as
duas telas não divergirem. A decisão antiga fica no `research.md` da 006 como registro do que se pensava
então.

---

## D10 — Propagação nos testes de backend: fixture compartilhada

**Decisão.** Criar `PontoFixture` no pacote de teste de Ponto, no mesmo espírito do `LocalFixture` que
a 006 criou, e usá-la em todos os testes que constroem `Ponto` ou chamam o cadastro.

**Justificativa.** O cadastro passa a exigir corpo e a entidade ganha campo. Os testes de Ponto, Coleta
e Impacto constroem `Ponto` como fixture — sem um ponto único de construção, o mesmo ajuste se repetiria
em nove arquivos, e o próximo campo repetiria de novo. Na 006 essa fixture foi criada só depois de a
repetição aparecer; aqui já se sabe que vem.

**Não é regra nova.** Esses testes entram na fase Red por **custo de propagação do modelo**, não porque
mudam de comportamento. São reescritos mecanicamente.

---

## D11 — Copiar o endereço do QR: completo, com saída se falhar

**Decisão.** A ação de copiar usa a API de área de transferência do navegador e copia o
`qrConteudo` **inteiro**. A exibição pode ser abreviada; o valor copiado nunca é. Se a cópia falhar ou
não estiver disponível, o endereço permanece visível e selecionável, com aviso de que não foi copiado.

**Justificativa.** FR-031. O mock exibe `sustentavel.app/p/96e96ba8`, que é o endereço real truncado no
identificador — copiar o texto exibido entregaria um link que **não abre**. É o tipo de defeito que
passa em revisão visual e só aparece quando alguém cola o link em uma conversa.

A área de transferência exige contexto seguro e pode ser negada por permissão. Falhar em silêncio faria
o Gestor colar o conteúdo anterior da área de transferência sem perceber.

---

## D12 — Situação e badge dos cartões

**Decisão.** O cartão e a linha exibem apenas **Ativo** ou **Arquivado**, com o mesmo vocabulário e
severidade de Locais.

**Justificativa.** As telas de referência mostram um badge "Novo" em um dos cartões, sem definir a regra
que o produz — nem quantos dias, nem se é "sem coleta ainda". Inventar a regra criaria um estado que
ninguém especificou e que o Gestor teria de descobrir lendo código. A situação, que tem regra
(RN-G-06), é exibida; o "Novo" fica de fora até existir definição. Registrado aqui para não ser lido
como esquecimento.

---

## D13 — Ficha alimentada pela linha, sem consulta de detalhe

**Decisão.** A ficha da estação recebe a estação **por input**, a partir da linha que a abriu, como a
ficha do Local faz. Não existe `GET /api/pontos/{id}` e não é criado.

**Justificativa.** A listagem já trouxe tudo que o cabeçalho da ficha precisa — referência, local,
situação, conteúdo do QR. Um endpoint de detalhe acrescentaria uma ida ao servidor para repetir dado que
está na mão. A única consulta que a ficha faz é a do histórico, que a listagem não tem.

**Consequência.** Depois de arquivar, reativar ou editar a referência, a ficha exibiria dado velho. O
comportamento adotado na 006 se repete: a ficha **fecha** ao disparar uma escrita que muda o que ela
mostra, e a lista recarrega. Editar a referência fecha a ficha e reabre o formulário; ao voltar, a lista
já tem o valor novo.

---

## Riscos

| Risco | Mitigação |
|---|---|
| A soma de litros no cliente acumula erro de ponto flutuante | Escala atual está muito abaixo do que a exibição mostra; formatação arredonda. Se precisar fechar centavo, a soma vai para o servidor (D5) |
| Alternar visualização perde o filtro | Uma única tabela dona do estado; não existe segundo estado para divergir (D6) |
| O filtro inicial corromper o painel do funil, como aconteceu na 006 | Filtro declarado pelo binding, nunca pela API imperativa (D6) |
| Estação sem referência aparecer como título vazio | Referência curta como identificação de reserva, com teste (FR-013) |
| Cadastro novo furar a obrigatoriedade com string em branco | Normalização antes da validação, no serviço (D4) |
| O endereço copiado sair truncado | Copia `qrConteudo`, nunca o texto exibido, com teste (D11) |
| Remover a rota aninhada quebrar URL salva | Área autenticada, sem link externo; redirecionamento resolve depois se incomodar (D8) |
| Nove arquivos de teste mudarem por um campo | Fixture compartilhada criada de saída, não depois da repetição (D10) |
