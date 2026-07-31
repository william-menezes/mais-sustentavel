---
description: "Tarefas de implementação — Referência da estação e visão geral de Pontos de coleta (CA-02 · VH-01 · VH-02 parcial)"
---

# Tasks: Referência da estação e visão geral de Pontos de coleta

**Input**: Documentos de projeto em `specs/007-referencia-visao-geral-pontos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pontos.md, quickstart.md

**Tests**: TDD **obrigatório** (Art. 5.2) — a **tarefa** de teste é sempre separada e anterior à tarefa de implementação que ela cobre. O ciclo é **Red → Green → Refactor por fatia**, não "todos os testes, depois todo o código".

**Organização**: por história de usuário. **MVP = US1 (visão geral)**, que já entrega valor sozinha: conserta o item morto do menu e mostra estações de todos os locais. US2 a US6 são incrementos.

**Ordem imposta por dependência de dado**: a fatia de API vem antes do frontend. A referência é o título do cartão e do painel, e `localNome` é metade do subtítulo — sem os dois no contrato, o frontend nasce exibindo travessão e nada pode ser validado de verdade.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (visão geral), US2 (referência), US3 (cadastro em painel), US4 (ficha), US5 (local empilhado), US6 (aviso de pendências)
- Caminhos relativos à raiz do repositório. Backend: `api/`. Frontend: `frontend/`.
- Base de pacote backend: `api/src/main/java/br/com/maissustentavel/api/` (abreviado `.../`).
- Base de testes backend: `api/src/test/java/br/com/maissustentavel/api/` (abreviado `test/.../`).
- **Vocabulário**: o atributo é **situação** (`ATIVO`/`ARQUIVADO`). A palavra **estação** é sinônimo de ponto de coleta na interface, como nas telas de referência.

---

## Phase 1: Setup

**Purpose**: criar apenas as pastas que ainda não existem. A arquitetura em camadas do frontend e o pacote por domínio do backend já estão no lugar.

> **Já existe e não vira tarefa**: `domain/ponto/{apis,interfaces,pages,components}`, `domain/coleta/apis` (com `ColetaService.listar` funcionando), `domain/local/components`, `widget/components/form-drawer`, `shared/services/viewport`, `core/i18n/pt-br`.

- [ ] T001 [P] Criar a pasta da ficha da estação em `frontend/src/app/domain/ponto/components/ponto-detalhe/`
- [ ] T002 [P] Criar a pasta do campo de busca de local em `frontend/src/app/domain/local/components/local-autocomplete/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: migração, campo na entidade e DTOs. Sem isto nenhuma história funciona, e a API não sobe (`ddl-auto: validate`).

> **Reaproveitado sem novas tarefas**: Flyway, Testcontainers, `SecurityConfig` (as rotas de ponto já caem em `anyRequest().authenticated()`), `GlobalExceptionHandler` e o contrato de erros — nada disso muda.

### Red — fixture compartilhada primeiro ⚠️

> A fixture vem **antes** dos ajustes mecânicos de propósito (research D10): na 006 ela foi criada só depois de a repetição aparecer em dez arquivos. Aqui já se sabe que vem.

- [ ] T003 Criar `PontoFixture` com um ponto de construção único para `Ponto` em testes — recebendo local e referência, com referência padrão para quem não se importa com ela, em `test/.../ponto/PontoFixture.java` (research D10)

### Red — reescrita por mudança de regra ⚠️

- [ ] T004 Reescrever `PontoRepositoryTest` — persistir `Ponto` **com** referência e **sem** referência (a coluna aceita nulo); confirmar que o CHECK recusa mais de 60 caracteres; `findByArquivadoFalse`/`True` seguem funcionando, em `test/.../ponto/PontoRepositoryTest.java` (**Ver falhar**; FR-010, FR-012, FR-017, data-model)

### Refatoração de fixture — **não é Red** ⚠️ premissa corrigida

> **A previsão estava errada.** Estas duas tarefas foram escritas afirmando que os seis arquivos parariam de compilar quando o cadastro passasse a exigir corpo. Ao abri-los, nenhum deles usa o cadastro: todos constroem `Ponto` **direto**, com `new Ponto()` e três setters, e os únicos caminhos de API que tocam são `/api/pontos/{id}/coletas`. Ou seja, **continuam compilando e passando** sem alteração alguma.
>
> As tarefas ficam, reclassificadas de Red para refatoração, pelo motivo que a decisão D10 já dava: seis construções idênticas do mesmo objeto significam que a **próxima** mudança no modelo de Ponto vira seis edições iguais. O ganho é de manutenção, não de correção — e por isso não há "Ver falhar" aqui.

- [ ] T005 [P] Trocar a construção manual de `Ponto` por `PontoFixture` nos testes de Coleta (`ColetaRepositoryTest`, `ColetaServiceTest`, `ColetaControllerTest`) em `test/.../coleta/` (depende de T003; research D10)
- [ ] T006 [P] Trocar a construção manual de `Ponto` por `PontoFixture` nos testes de Impacto (`ImpactoRepositoryTest`, `ImpactoServiceTest`, `ImpactoControllerTest`) em `test/.../impacto/` (depende de T003; research D10)

### Green — implementação

- [ ] T007 [P] Migração `V7__referencia_ponto.sql` — coluna `referencia text` **nullable** e constraint `ponto_referencia_tamanho_check` com `char_length(referencia) <= 60`, terminando com o comentário da consulta de fila de trabalho (`select id, local_id from ponto where referencia is null`), em `api/src/main/resources/db/migration/V7__referencia_ponto.sql` (FR-012, FR-017, research D1, data-model)
- [ ] T008 Entidade `Ponto` — campo `referencia` sem `length` no `@Column` (o limite é do banco e do DTO) e sem `nullable = false`, em `.../ponto/domain/Ponto.java` (depende de T007; FR-010, FR-012)

> **Os DTOs saíram desta fase** depois do `/speckit-analyze`. `PontoResponse` (T010) foi para a US1 e `PontoRequest` (T009) para a US2, cada um logo **depois** do teste que o cobre. Estavam aqui por reflexo — na 006 a Foundational continha entidade e DTOs, mas lá os DTOs eram testados na própria Foundational. Aqui não são, e a ordem violava o Art. 5.2.

---

## Phase 3: User Story 1 — Ver todas as estações numa tela só (Priority: P1) 🎯 MVP

**Goal**: a visão geral que não existe, com estações de todos os locais, contagem, filtro por coluna e alternância cartões/tabela.

**Independent Test**: com estações em dois locais, abrir a tela pelo menu, ver estações dos dois, alternar visualização e filtrar por local. Entrega valor mesmo antes de a referência estar preenchida — estação sem referência aparece pela referência curta.

### Red — Backend ⚠️

- [ ] T011 Ampliar `PontoRepositoryTest` — consulta global ordenada por nome do local e depois por referência, com nulos ao fim do grupo do seu local; e **uma única consulta** ao ler `localNome` (contar consultas ou afirmar o `join fetch`), em `test/.../ponto/PontoRepositoryTest.java` (**Ver falhar**; FR-001, contracts)
- [ ] T012 [P] Ampliar `PontoServiceTest` — listagem global devolve ativos por padrão e arquivados quando pedido, com `localNome` preenchido, em `test/.../ponto/PontoServiceTest.java` (**Ver falhar**; FR-001, FR-003, FR-007)
- [ ] T013 [P] Ampliar `PontoControllerTest` — `GET /api/pontos` responde 200 com o array; `?arquivados=true` troca o conjunto; exige sessão autenticada, em `test/.../ponto/PontoControllerTest.java` (**Ver falhar**; FR-001, FR-007, contracts)

### Green — Backend

- [ ] T010 [P] [US1] `PontoResponse` — acrescentar `referencia` e `localNome`, em `.../ponto/web/dto/PontoResponse.java` (depende de T012, T013; FR-003, FR-014, contracts)
- [ ] T014 Consulta global no `PontoRepository` com `join fetch` do local e ordenação por nome do local e referência, em `.../ponto/repository/PontoRepository.java` (depende de T011; FR-001)
- [ ] T015 Método de listagem global no `PontoService`, mapeando `localNome` a partir do local carregado, em `.../ponto/service/PontoService.java` (depende de T014; FR-001, FR-003)
- [ ] T016 `GET /api/pontos` no `PontoController`, com parâmetro `arquivados` padrão `false`, em `.../ponto/web/PontoController.java` (depende de T015; FR-001, FR-007, contracts)

### Red → Green — Frontend, dados ⚠️

- [ ] T017 [P] [US1] Interfaces de Ponto — `referencia`, `localNome` e a derivada `PontoNaLista` com `situacao`, `titulo` e `refCurta`, em `frontend/src/app/domain/ponto/interfaces/ponto.interface.ts` (FR-003, FR-013, data-model)
- [ ] T018 [US1] `ponto.api.spec.ts` — `listar()` global chama `/api/pontos` com `arquivados`, em `frontend/src/app/domain/ponto/apis/ponto.api.spec.ts` (**Ver falhar**; FR-001)
- [ ] T019 [US1] Método de listagem global no `PontoService` do frontend até T018 passar, em `frontend/src/app/domain/ponto/apis/ponto.api.ts` (depende de T018)

### Red → Green — Frontend, rota ⚠️

- [ ] T020 [US1] Teste de rota — `/pontos` resolve para a visão geral e `locais/:localId/pontos` **não** existe mais, em `frontend/src/app/app.routes.spec.ts` (**Ver falhar**; FR-002, FR-008, research D8)
- [ ] T021 [US1] Acrescentar `/pontos` e remover `locais/:localId/pontos` em `frontend/src/app/app.routes.ts`, ajustando `frontend/src/app/domain/ponto/ponto.routes.ts` para montar na coleção (depende de T020; FR-002, FR-008)

### Red → Green — Frontend, visão geral ⚠️

- [ ] T022 [US1] `pontos.page.spec.ts` — carrega ativos e arquivados; contador de exibidos e total; **filtro inicial de situação declarado pelo binding de filtros**, com condição para **todas** as colunas filtráveis; distinção entre "nenhuma estação cadastrada" e "nenhuma corresponde ao filtro"; **uma única chamada** à listagem, sem uma por linha, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.spec.ts` (**Ver falhar**; FR-001, FR-005, FR-006, FR-007, FR-009, research D6)
- [ ] T023 [US1] Reescrever a página como visão geral em modo tabela até a parte correspondente de T022 passar — `p-table` com `filterDisplay="menu"`, filtros de Local, Situação e Referência, contador, e o filtro inicial **declarado** (nunca por `tabela.filter()`, que corrompe o painel do funil), em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.{ts,html,scss}` (depende de T021, T022; FR-001, FR-003, FR-005, FR-006, FR-007, FR-009, research D6)
- [ ] T024 [US1] Ampliar `pontos.page.spec.ts` — alternância cartões/tabela **preservando o filtro aplicado**, e o painel do funil abrindo **com o valor filtrado visível** (regressão da 006), em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.spec.ts` (**Ver falhar**; FR-004, SC-002)
- [ ] T025 [US1] Modo cartões até T024 passar — mesma `p-table` dona do estado, corpo renderizando uma linha com uma célula que contém a grade alimentada por `filteredValue`, com os funis visíveis nos dois modos, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.{ts,html,scss}` (depende de T023, T024; FR-004, research D6)
- [ ] T026 [US1] Ampliar `locais.page.spec.ts` — "Ver pontos" na linha do Local navega para `/pontos` **filtrado por aquele local**, em `frontend/src/app/domain/local/pages/locais/locais.page.spec.ts` (**Ver falhar**; FR-008)
- [ ] T027 [US1] Ligar "Ver pontos" à visão geral filtrada até T026 passar, semeando o filtro de Local pelo binding a partir do parâmetro recebido, em `frontend/src/app/domain/local/pages/locais/locais.page.ts` e `frontend/src/app/domain/ponto/pages/pontos/pontos.page.ts` (depende de T023, T026; FR-008, research D8)
- [ ] T028 [US1] Rodar `docker compose run --rm api mvn verify` e `npx ng test --watch=false` no frontend, ambos verdes

**Checkpoint**: o item morto do menu funciona e a visão geral entrega valor sozinha.

---

## Phase 4: User Story 2 — Distinguir duas estações do mesmo local (Priority: P1)

**Goal**: a referência que dá identidade à estação, exigida em cadastros novos e editável nos antigos.

**Independent Test**: cadastrar duas estações no mesmo local com referências diferentes e conferir que a lista as distingue sem abrir nenhuma; alterar a referência de uma estação existente e ver a lista mudar.

### Red — Backend ⚠️

- [ ] T029 [P] [US2] Ampliar `PontoServiceTest` — cadastro **normaliza com `trim`** antes de persistir; referência só com espaços é **recusada**, nunca convertida em `null` (senão fura a obrigatoriedade por dentro, já que a coluna aceita nulo); edição altera a referência; edição **não** move a estação de local; edição **não** altera `qrConteudo`, em `test/.../ponto/PontoServiceTest.java` (**Ver falhar**; FR-011, FR-015, FR-016, FR-018, research D3, D4)
- [ ] T030 [P] [US2] Ampliar `PontoControllerTest` — cadastro sem corpo, com referência vazia, só espaços e acima de 60 caracteres responde `400` com o mapa `campos`; `PUT /api/pontos/{id}` responde 200 e `404` para estação inexistente; `localId` enviado no corpo do `PUT` é ignorado e a estação permanece no mesmo local; **a estação criada continua recebendo QR único** — o caminho de cadastro muda de forma nesta feature e a garantia não pode sair de graça, em `test/.../ponto/PontoControllerTest.java` (**Ver falhar**; FR-011, FR-015, FR-017, FR-018, **FR-026**, contracts)

### Green — Backend

- [ ] T009 [P] [US2] `PontoRequest` **novo** — `referencia` com `@NotBlank` e `@Size(max = 60)`; **sem** `localId` no corpo, em `.../ponto/web/dto/PontoRequest.java` (depende de T029, T030; FR-011, FR-017, FR-018, contracts)
- [ ] T031 [US2] `PontoService` — cadastro recebendo a referência do corpo com `trim`, e operação de edição que altera **somente** a referência, em `.../ponto/service/PontoService.java` (depende de T009, T029; FR-011, FR-015, FR-016, research D3, D4)
- [ ] T032 [US2] `PontoController` — corpo `@Valid` no cadastro e `PUT /api/pontos/{id}`, em `.../ponto/web/PontoController.java` (depende de T031; FR-011, FR-015, FR-018, contracts)

### Red → Green — Frontend ⚠️

- [ ] T033 [US2] Ampliar `ponto.api.spec.ts` — criar envia corpo com a referência; editar chama `PUT /api/pontos/{id}`, em `frontend/src/app/domain/ponto/apis/ponto.api.spec.ts` (**Ver falhar**; FR-011, FR-015)
- [ ] T034 [US2] Métodos de criar com corpo e editar até T033 passar, em `frontend/src/app/domain/ponto/apis/ponto.api.ts` (depende de T033)
- [ ] T035 [US2] Ampliar `pontos.page.spec.ts` — estação **com** referência é identificada por ela; estação **sem** referência cai para a referência curta e **nenhum rótulo é inventado**; a coluna de referência é filtrável, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.spec.ts` (**Ver falhar**; FR-013, FR-014, SC-002, SC-003)
- [ ] T036 [US2] Título derivado (`referencia` ou referência curta) na tabela e no cartão até T035 passar, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.{ts,html}` (depende de T035; FR-013, FR-014)

---

## Phase 5: User Story 3 — Cadastrar uma estação sem sair da tela (Priority: P2)

**Goal**: o painel de cadastro com busca de local e campo de referência.

**Independent Test**: abrir o painel pela lista, buscar um local pelo nome e pelo bairro, informar a referência, concluir, e ver a estação na lista com o QR disponível.

> **FR-049 e FR-050 (aviso de pendências) nascem aqui**, porque o cenário "sei que falta escolher o local" da US3 precisa deles. A US6 estende o mesmo recurso ao formulário de Local (FR-051).

### Red → Green — aviso de pendências no painel compartilhado ⚠️

- [ ] T037 [US3] Ampliar `form-drawer.component.spec.ts` — input de pendência exibido no rodapé quando preenchido e ausente quando vazio, funcionando **tanto** com o rodapé padrão **quanto** com rodapé projetado, em `frontend/src/app/widget/components/form-drawer/form-drawer.component.spec.ts` (**Ver falhar**; FR-049, FR-050, research D9)
- [ ] T038 [US3] Input `pendencia` renderizado **antes** do slot de ações até T037 passar — colocá-lo dentro do conteúdo de reserva o deixaria disponível só para quem usa Cancelar/Salvar, em `frontend/src/app/widget/components/form-drawer/form-drawer.component.{ts,html,scss}` (depende de T037; FR-049, FR-050, research D9)

### Red → Green — busca de local ⚠️

- [ ] T039 [US3] `local-autocomplete.component.spec.ts` — carrega locais ativos **uma vez**; filtra por nome e por bairro; **ignora acentos e caixa** ("Uberlandia" encontra "Uberlândia"); **não oferece locais arquivados**; emite o local escolhido; estado sem resultado é visível, em `frontend/src/app/domain/local/components/local-autocomplete/local-autocomplete.component.spec.ts` (**Ver falhar**; FR-020, FR-021, research D7)
- [ ] T040 [US3] Implementar o componente de busca até T039 passar, em `frontend/src/app/domain/local/components/local-autocomplete/local-autocomplete.component.{ts,html,scss}` (depende de T002, T039; FR-020, FR-021)

### Red → Green — cadastro de estação ⚠️

- [ ] T041 [US3] Ampliar `ponto-form.component.spec.ts` — campo de local por busca e campo de referência; concluir indisponível sem local e sem referência, com o rodapé nomeando o que falta; espaços em volta da referência descartados; cancelar não cria nada; o painel informa que o QR é automático e o que fazer depois de concluir; **`nivel` e local pré-selecionado recebidos por input**, para o painel funcionar aberto da lista (nível 0) e da ficha do Local (nível 1), em `frontend/src/app/domain/ponto/components/ponto-form/ponto-form.component.spec.ts` (**Ver falhar**; FR-019, FR-022, FR-023, FR-024, FR-025, FR-016)
- [ ] T042 [US3] Estender o painel de cadastro até T041 passar — acrescentar busca de local, referência e aviso de pendências ao painel que **já existe**, sem reescrevê-lo, em `frontend/src/app/domain/ponto/components/ponto-form/ponto-form.component.{ts,html,scss}` (depende de T034, T038, T040, T041; FR-019 a FR-025)
- [ ] T043 [US3] Ampliar `pontos.page.spec.ts` — "Novo ponto" abre o painel e a estação criada aparece na lista, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.spec.ts` (**Ver falhar**; FR-019, SC-004)
- [ ] T044 [US3] Hospedar o painel de cadastro na visão geral até T043 passar, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.{ts,html}` (depende de T042, T043)
- [ ] T045 [US3] Ampliar `local-detalhe.component.spec.ts` — ao abrir o cadastro de ponto pela ficha do Local, o painel recebe **aquele local já escolhido** e `nivel` 1, em `frontend/src/app/domain/local/components/local-detalhe/local-detalhe.component.spec.ts` (**Ver falhar**; depende de T042; FR-019)
- [ ] T064 [US3] Passar local pré-selecionado e `nivel` até T045 passar — sem isso o painel abriria pela ficha pedindo um local que já se sabe qual é, e no nível de empilhamento errado, em `frontend/src/app/domain/local/components/local-detalhe/local-detalhe.component.{ts,html}` (depende de T045; FR-019)

---

## Phase 6: User Story 4 — Consultar a ficha de uma estação (Priority: P2)

**Goal**: a ficha com QR, endereço público, três indicadores e histórico de coletas. Entrega o **VH-02** no nível da estação.

**Independent Test**: abrir a ficha de uma estação com coletas e conferir os indicadores contra o histórico; abrir a de uma estação sem coleta e conferir que os números não mentem.

> **Reaproveitado sem tarefa nova**: `ColetaService.listar(pontoId)` já devolve `ColetasDoPonto { totalLitros, coletas }`, com o total somado no servidor. Só a média é derivada na tela (research D5).

### Red → Green — ficha ⚠️

- [ ] T046 [US4] `ponto-detalhe.component.spec.ts` — referência como título, local e situação; QR com referência curta e endereço público; **total vindo de `totalLitros`**, valor social a R$ 1,00 por litro e média igual a total ÷ quantidade; **média como ausência e nunca zero** sem coletas; histórico da mais recente para a mais antiga; **coleta sem coletor indica a ausência** em vez de deixar espaço vazio; falha do histórico degrada só a seção; **uma única** consulta de coletas, em `frontend/src/app/domain/ponto/components/ponto-detalhe/ponto-detalhe.component.spec.ts` (**Ver falhar**; FR-028 a FR-036, FR-041, SC-007, SC-009, SC-012)
- [ ] T047 [US4] Implementar a ficha até T046 passar, sobre o painel compartilhado com `closable` e rodapé projetado, em `frontend/src/app/domain/ponto/components/ponto-detalhe/ponto-detalhe.component.{ts,html,scss}` (depende de T001, T046; FR-027 a FR-036, FR-041)
- [ ] T048 [US4] Ampliar `ponto-detalhe.component.spec.ts` — copiar entrega o **`qrConteudo` completo**, nunca o texto exibido abreviado; falha da área de transferência mantém o endereço visível e avisa; baixar o QR usa a referência curta no nome do arquivo, em `frontend/src/app/domain/ponto/components/ponto-detalhe/ponto-detalhe.component.spec.ts` (**Ver falhar**; FR-029, FR-030, FR-031, SC-008, research D11)
- [ ] T049 [US4] Implementar copiar e baixar até T048 passar, em `frontend/src/app/domain/ponto/components/ponto-detalhe/ponto-detalhe.component.{ts,html}` (depende de T048; FR-030, FR-031)
- [ ] T050 [US4] Ampliar `ponto-detalhe.component.spec.ts` — ver o local abre a ficha do Local **empilhada**; arquivar e reativar emitem para quem hospeda; editar abre o formulário; registrar coleta leva à tela de coletas da estação, em `frontend/src/app/domain/ponto/components/ponto-detalhe/ponto-detalhe.component.spec.ts` (**Ver falhar**; FR-037, FR-038, FR-039, FR-040)
- [ ] T051 [US4] Ligar as ações do rodapé até T050 passar, reaproveitando a ficha do Local já existente para o empilhamento, em `frontend/src/app/domain/ponto/components/ponto-detalhe/ponto-detalhe.component.{ts,html}` (depende de T050; FR-037 a FR-040)
- [ ] T052 [US4] Ampliar `pontos.page.spec.ts` — a ficha abre pela linha e pelo cartão, alimentada pela linha (sem consulta de detalhe); depois de arquivar, reativar ou editar, a ficha fecha e a lista recarrega, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.spec.ts` (**Ver falhar**; FR-027, research D13)
- [ ] T053 [US4] Hospedar a ficha na visão geral até T052 passar, em `frontend/src/app/domain/ponto/pages/pontos/pontos.page.{ts,html}` (depende de T047, T052)

---

## Phase 7: User Story 5 — Cadastrar o local que ainda não existe (Priority: P3)

**Goal**: a busca sem resultado oferece criar o local, empilhado, e ele volta selecionado. Primeira validação de painel sobre painel **com escrita**.

**Independent Test**: buscar um local inexistente, criá-lo pelo caminho oferecido, e conferir que ele volta selecionado e que a referência já digitada continua preenchida.

### Red → Green ⚠️

- [ ] T054 [US5] Ampliar `local-autocomplete.component.spec.ts` — sem resultado, oferece adicionar o local; ao acionar, o formulário de Local abre **empilhado**; o local criado volta **selecionado** no campo; cancelar não cria local e devolve o campo como estava, em `frontend/src/app/domain/local/components/local-autocomplete/local-autocomplete.component.spec.ts` (**Ver falhar**; FR-042, FR-043, FR-045, FR-047)
- [ ] T055 [US5] Ligar o formulário de Local **já existente** ao estado vazio até T054 passar, sem duplicá-lo, em `frontend/src/app/domain/local/components/local-autocomplete/local-autocomplete.component.{ts,html}` (depende de T040, T054; FR-042, FR-043, FR-045, FR-048)
- [ ] T056 [US5] Ampliar `ponto-form.component.spec.ts` — a referência já digitada **continua preenchida** durante e depois do cadastro do local; os dois painéis coexistem no DOM ao empilhar, em `frontend/src/app/domain/ponto/components/ponto-form/ponto-form.component.spec.ts` (**Ver falhar**; FR-044, FR-046, SC-005)
- [ ] T057 [US5] Garantir a preservação do formulário e os níveis de empilhamento até T056 passar, em `frontend/src/app/domain/ponto/components/ponto-form/ponto-form.component.{ts,html}` (depende de T055, T056; FR-044, FR-046)

---

## Phase 8: User Story 6 — Aviso de pendências no formulário de Local (Priority: P3)

**Goal**: estender ao cadastro de Local o aviso que a US3 criou, para as duas telas não divergirem.

**Independent Test**: abrir o formulário de Local com obrigatórios em branco e conferir que o rodapé nomeia os campos que faltam e que a mensagem desaparece quando tudo está preenchido.

> Revisa a decisão da 006, que era deixar o botão apenas desabilitado. A revisão é do Gestor do produto; o `research.md` da 006 permanece como registro do que se pensava então.

### Red → Green ⚠️

- [ ] T058 [US6] Ampliar `local-form.component.spec.ts` — o rodapé nomeia os obrigatórios em branco e o aviso desaparece quando o formulário está completo, em `frontend/src/app/domain/local/components/local-form/local-form.component.spec.ts` (**Ver falhar**; FR-050, FR-051)
- [ ] T059 [US6] Montar a lista de pendências no formulário de Local até T058 passar, usando o input do painel compartilhado, em `frontend/src/app/domain/local/components/local-form/local-form.component.{ts,html}` (depende de T038, T058; FR-051)

---

## Phase 9: Polish & Cross-Cutting

- [ ] T060 [P] Executar o roteiro de `specs/007-referencia-visao-geral-pontos/quickstart.md` — os sete roteiros, conferindo **SC-001 a SC-012**, e a V7 numa base **com** dados e numa base **vazia**
- [ ] T061 [P] Revisão de segurança e conformidade — validação reprovando pelo servidor via `curl` contornando o formulário (FR-018); `PUT` com `localId` no corpo **não** move a estação (RN-G-05); editar a referência **não** altera `qrConteudo`; erros sem vazar detalhe interno; RLS ainda habilitada na `ponto`; **nenhuma superfície pública passa a expor dado novo** (FR-054); **todos os rótulos e mensagens novos em pt-BR** (FR-052)
- [ ] T062 [P] Registrar em `docs/design.md` os dois padrões que esta feature estabelece — alternância de visualização com uma única fonte de estado de filtro, e campo relacional com criação empilhada agora **exercitado de verdade** — atualizando a nota que hoje diz que o autocomplete do padrão não foi exercitado
- [ ] T063 Validação final — `docker compose run --rm api mvn verify`, `npx ng test --watch=false` e `npm run build` **sem estouro de orçamento** (a tela nova em chunk sob demanda), com CI verde antes do merge (Art. 5.5)

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T008)** → **US1 (T011–T028, mais T010)** → **US2 (T029–T036, mais T009)** → **US3 (T037–T045, T064)** → **US4 (T046–T053)** → **US5 (T054–T057)** → **US6 (T058–T059)** → **Polish (T060–T063)**.

> **Os IDs não são monotônicos em três pontos**, e a ordem de execução é a **do documento**, não a numérica. `T010` vive na US1 e `T009` na US2 porque o `/speckit-analyze` mostrou que estavam antes dos testes que os cobrem; `T064` é o Green que faltava ao par de `T045`. Manter os IDs estáveis preservou as dezenas de referências cruzadas de dependência — renumerar teria sido a chance de errar uma delas em silêncio. A 006 já tinha esse precedente, com os IDs do Polish anteriores aos da US5.

- **Foundational bloqueia tudo**: sem a migração e o campo na entidade a API não sobe (`ddl-auto: validate`), e sem os DTOs nada compila.

- Dentro de cada história, os pares Red→Green são explícitos: **T011→T014**, **T012/T013→T010/T015/T016**, **T018→T019**, **T020→T021**, **T022→T023**, **T024→T025**, **T026→T027**, **T029/T030→T009/T031/T032**, **T033→T034**, **T035→T036**, **T037→T038**, **T039→T040**, **T041→T042**, **T043→T044**, **T045→T064**, **T046→T047**, **T048→T049**, **T050→T051**, **T052→T053**, **T054→T055**, **T056→T057**, **T058→T059**. O teste é tarefa própria e vem antes — **sem exceção**, depois das correções do `/speckit-analyze`.

- **US2 depende de US1** apenas para ter tela onde aparecer; a fatia de API dela é independente.

- **US3 depende de US2** (o cadastro exige referência, que a US2 cria no contrato) e cria o aviso de pendências que a **US6** estende.

- **US4 depende de US1** (é aberta pela lista) e de US2 (a referência é o título da ficha).

- **US5 depende de US3** — o estado vazio que ela transforma em oferta só existe depois da busca.

### Paralelismo

- **Foundational**: T005 e T006 em paralelo (arquivos de teste de domínios diferentes), depois de T003. T007, T009 e T010 em paralelo entre si.
- **US1**: T012 e T013 em paralelo (arquivos diferentes). T017 em paralelo com os testes de backend.
- **US2**: T029 e T030 em paralelo.
- **Polish**: T060, T061 e T062 em paralelo; T063 por último.

---

## Implementation Strategy

**MVP = US1.** Conserta o item morto do menu e entrega a visão geral, com estações identificadas pela referência curta enquanto a referência não existir. É demonstrável sozinho.

**Incremento seguinte = US2**, que dá identidade às estações e torna a lista de fato utilizável. As duas juntas cobrem o que o Gestor mais sente falta hoje.

**US3 a US6** são melhorias de fluxo sobre uma tela que já funciona.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente.
- Backend roda só no Docker (Art. 1.6); frontend no host.
- Todo componente Angular passa pela skill `angular-developer` + MCP do PrimeNG — não reimplementar o que a biblioteca já entrega.
- **A lição da 006 vale aqui e está embutida em T022, T023 e T024**: em `filterDisplay="menu"` o estado de filtro de cada campo é um **array de condições**, e a API imperativa `tabela.filter(valor, campo, modo)` grava a forma de linha e corrompe o painel do funil. Filtro inicial **declarado pelo binding**, e condição declarada para **todas** as colunas filtráveis — uma coluna ausente perde a condição que o PrimeNG cria sozinho e abre o painel vazio.
- **A remoção da tela de estações por local é verificável, não uma promessa**: a tabela em `research.md` D8 diz para onde vai cada recurso dela. T060 confere.
