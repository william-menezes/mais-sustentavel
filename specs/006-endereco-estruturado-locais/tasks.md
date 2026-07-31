---
description: "Tarefas de implementação — Endereço estruturado e visão geral de Locais (CA-01 · VH-01)"
---

# Tasks: Endereço estruturado e visão geral de Locais

**Input**: Documentos de projeto em `specs/006-endereco-estruturado-locais/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/locais.md, quickstart.md

**Tests**: TDD **obrigatório** (Art. 5.2) — a **tarefa** de teste é sempre separada e anterior à tarefa de implementação que ela cobre. O ciclo é **Red → Green → Refactor por fatia**, não "todos os testes, depois todo o código".

**Organização**: por história de usuário. **MVP = US1 (endereço estruturado)**. US2 (visão geral filtrável), US3 (CEP) e US4 (painel) são incrementos independentes.

> **Revisado após `/speckit-analyze`.** A primeira versão empacotava a spec do componente dentro da tarefa de implementação no frontend, o que permitia escrever código antes do teste — violação da letra do Art. 5.2. Cada par Red/Green do frontend agora é duas tarefas. Também foram fechadas as lacunas de FR-006, FR-021, FR-029 e FR-031, e fixado o breakpoint do painel (research D8).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (endereço estruturado), US2 (visão geral), US3 (CEP), US4 (painel)
- Caminhos relativos à raiz do repositório. Backend: `api/`. Frontend: `frontend/`.
- Base de pacote backend: `api/src/main/java/br/com/maissustentavel/api/` (abreviado `.../`).
- Base de testes backend: `api/src/test/java/br/com/maissustentavel/api/` (abreviado `test/.../`).
- **Vocabulário**: o atributo é **situação** (`ATIVO`/`ARQUIVADO`), como na spec. *Status* é apenas o rótulo da coluna na interface.

---

## Phase 1: Setup

**Purpose**: criar apenas as pastas que ainda não existem. A arquitetura em camadas do frontend e o pacote por domínio do backend já estão no lugar.

- [ ] T001 [P] Criar a pasta do componente compartilhado em `frontend/src/app/widget/components/form-drawer/`
- [ ] T002 [P] Criar a pasta da camada de acesso a dados de impacto em `frontend/src/app/domain/impacto/apis/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: migração, enum, entidade e DTOs. Sem isto nenhuma história funciona, e o backend não sobe (`ddl-auto: validate`).

> **Reaproveitado sem novas tarefas**: Flyway, Testcontainers, `SecurityConfig` (a rota `/api/locais` já cai em `anyRequest().authenticated()`), `GlobalExceptionHandler` e o contrato de erros da CA-01 — nada disso muda.

### Red — reescrita por mudança de regra ⚠️

- [ ] T003 Reescrever `LocalRepositoryTest` — persistir Local com os sete componentes de endereço; confirmar que `endereco_legado` **não** é mapeado na entidade; `findByArquivadoFalse`/`True` seguem funcionando, em `test/.../local/LocalRepositoryTest.java` (data-model)

### Red — ajuste mecânico de fixture ⚠️

> Estes dez arquivos **não mudam de comportamento**: apenas constroem `Local` como fixture e param de compilar quando `endereco` deixa de existir. Esforço é de substituição, não de reprojeto — por isso vão em paralelo e separados de T003.

- [ ] T004 [P] Ajustar as fixtures de `Local` nos testes de Ponto (`PontoRepositoryTest`, `PontoServiceTest`, `PontoControllerTest`) em `test/.../ponto/`
- [ ] T005 [P] Ajustar as fixtures de `Local` nos testes de Coleta (`ColetaRepositoryTest`, `ColetaServiceTest`, `ColetaControllerTest`) em `test/.../coleta/`
- [ ] T006 [P] Ajustar as fixtures de `Local` nos testes de Impacto (`ImpactoRepositoryTest`, `ImpactoServiceTest`, `ImpactoControllerTest`) em `test/.../impacto/`
- [ ] T007 [P] Ajustar a fixture de `Local` em `test/.../SecurityCsrfTest.java`, mantendo verde a proteção anti-CSRF das escritas (**FR-029** — o requisito é satisfeito pela CA-01; esta tarefa garante que continua valendo após a troca dos DTOs)

### Green — implementação

- [ ] T008 [P] Enum `Uf` com as 27 unidades federativas, no padrão de `TipoLocal`, em `.../local/domain/Uf.java` (FR-004, research D2)
- [ ] T009 [P] Migração `V6__endereco_estruturado.sql` — adicionar `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `uf` como **nullable**; `update local set rua = endereco`; renomear `endereco` para `endereco_legado` e torná-la nullable, em `api/src/main/resources/db/migration/V6__endereco_estruturado.sql` (FR-008, research D1, data-model)
- [ ] T010 Entidade `Local` — trocar o campo `endereco` pelos sete componentes, com `uf` em `@Enumerated(STRING)` e `numero` como `String` (FR-006); **não** mapear `endereco_legado`, em `.../local/domain/Local.java` (depende de T008; FR-001)
- [ ] T011 [P] DTOs `LocalRequest` (com `@NotBlank` em nome/rua/numero/bairro/cidade, `@Pattern("\\d{8}")` no cep, `@NotNull` em tipo/uf, complemento sem restrição) e `LocalResponse` (sete componentes no lugar de `endereco`) em `.../local/web/dto/` (FR-002, FR-003, FR-006, FR-009; contracts/locais.md)
- [ ] T012 Rodar `mvn verify` no Docker e deixar T003 a T007 **verdes** — valida o mapeamento JPA contra o esquema da V6 (depende de T008 a T011)

**Checkpoint**: schema migrado, entidade e contrato no formato novo, suíte compilando.

---

## Phase 3: User Story 1 — Cadastrar um local com endereço estruturado (Priority: P1) 🎯 MVP

**Goal**: o Gestor informa o endereço em sete campos, salva, e ao reabrir para edição cada componente volta no seu lugar.

**Independent Test**: `POST /api/locais` com os sete componentes cria 201; complemento ausente é aceito; obrigatório vazio, CEP com menos de 8 dígitos e UF fora da lista retornam 400; reabrir para edição traz os campos separados (quickstart roteiro 1 — SC-001, SC-003).

### Red — Backend ⚠️

- [ ] T013 [P] [US1] Reescrever `LocalServiceTest` — `criar` e `editar` persistem os sete componentes; alterar só o número não afeta os demais; 404 em id inexistente, em `test/.../local/LocalServiceTest.java` (FR-001, FR-007)
- [ ] T014 [P] [US1] Reescrever `LocalControllerTest` — 201 com endereço completo; 201 com complemento ausente; **201 com número `s/n` e `120A`** (FR-006); 400 para obrigatório vazio, obrigatório só com espaços, CEP fora de 8 dígitos e UF inválida; 401 sem sessão, em `test/.../local/LocalControllerTest.java` (FR-002, FR-003, FR-006, FR-009, FR-028; contracts/locais.md)

### Green — Backend

- [ ] T015 [US1] Ajustar `LocalService.criar` e `LocalService.editar` para os sete componentes em `.../local/service/LocalService.java` (depende de T010, T011; FR-001, FR-007)
- [ ] T016 [US1] Conferir `LocalController` — as rotas e status **não mudam**; apenas os DTOs trafegados, em `.../local/web/LocalController.java` (contracts/locais.md)
- [ ] T017 [US1] Rodar `mvn verify` no Docker → T013 e T014 **verdes**

### Green — Frontend, dados (via skill `angular-developer` + MCP PrimeNG)

- [ ] T018 [P] [US1] Constante `UFS` (`{ label, value }[]` das 27 siglas) em `frontend/src/app/domain/local/constants/uf.constant.ts` (FR-004, data-model)
- [ ] T019 [P] [US1] Atualizar `Local`, `LocalRequest` e adicionar o tipo `Uf` em `frontend/src/app/domain/local/interfaces/local.interface.ts` (data-model)

### Red → Green — Frontend, camada de API ⚠️

- [ ] T020 [US1] Atualizar `local.api.spec.ts` para o payload novo com `HttpTestingController`, **vendo falhar**, em `frontend/src/app/domain/local/apis/local.api.spec.ts` (depende de T019; contracts/locais.md)
- [ ] T021 [US1] Ajustar `local.api.ts` até T020 passar, em `frontend/src/app/domain/local/apis/local.api.ts`

### Red → Green — Frontend, formulário ⚠️

- [ ] T022 [US1] Atualizar `local-form.component.spec.ts` — nove campos; complemento opcional; salvar desabilitado com obrigatório em branco; CEP exposto formatado e enviado sem máscara. **Ver falhar**, em `frontend/src/app/domain/local/components/local-form/local-form.component.spec.ts` (FR-002, FR-005, FR-025)
- [ ] T023 [US1] Implementar o formulário até T022 passar — CEP via `p-inputmask` `mask="99999-999"` consumindo `onUnmaskedChange`, `p-select` para tipo e UF, em `frontend/src/app/domain/local/components/local-form/` (research D9, D10)

### Red → Green — Frontend, lista ⚠️

- [ ] T024 [US1] Atualizar `locais.page.spec.ts` — a coluna Local exibe o endereço resumido (`rua, numero — bairro`). **Ver falhar**, em `frontend/src/app/domain/local/pages/locais/locais.page.spec.ts` (FR-015)
- [ ] T025 [US1] Implementar o endereço resumido até T024 passar, em `frontend/src/app/domain/local/pages/locais/`
- [ ] T026 [US1] Rodar `npm test -- --watch=false` (verde) e `npm run build` (sem erro) no frontend

**Checkpoint**: endereço estruturado funcionando ponta a ponta — **entregável do MVP**.

---

## Phase 4: User Story 2 — Ter visão geral dos locais e encontrar um deles (Priority: P2)

**Goal**: ativos e arquivados na mesma lista, filtro por menu de funil em cada coluna, contador de exibidos sobre total, e litros por local.

**Independent Test**: abrir a lista mostra só ativos com contador `N de M`; filtrar situação, tipo, litros e nome devolve o subconjunto certo; filtro sem correspondência mostra mensagem própria; local sem coleta mostra `0 L` (quickstart roteiro 3 — SC-006, SC-007).

### Red → Green — litros ⚠️

- [ ] T027 [P] [US2] `impacto.api.spec.ts` — cobrir os três estados de litros: local ausente do agregado (zero), presente (valor) e chamada falhando (indisponível), com `HttpTestingController`. **Ver falhar**, em `frontend/src/app/domain/impacto/apis/impacto.api.spec.ts` (FR-020, research D6)
- [ ] T028 [US2] `impacto.api.ts` consumindo `GET /api/impacto/valor-social/por-local` até T027 passar, em `frontend/src/app/domain/impacto/apis/impacto.api.ts` (research D6)

### Red — lista filtrável ⚠️

- [ ] T029 [P] [US2] Ampliar `locais.page.spec.ts` — filtro inicial em "ativo"; contador exibidos/total; filtro por tipo, por situação e por faixa de litros; **mensagem de "nenhum resultado para o filtro" distinta da de lista sem cadastro** (FR-021); litros exibindo `0 L` sem coleta e `—` com agregado indisponível. **Ver falhar**, em `frontend/src/app/domain/local/pages/locais/locais.page.spec.ts` (FR-016 a FR-021)

### Green — lista filtrável

- [ ] T030 [US2] Carregar ativos e arquivados em paralelo e derivar a **situação** como valor discreto (`ATIVO`/`ARQUIVADO`) em `frontend/src/app/domain/local/pages/locais/locais.page.ts` (FR-017, research D7)
- [ ] T031 [US2] Tabela com `[filterDisplay]="'menu'"` e um `p-column-filter` por coluna — texto para Local, `p-select` com `matchMode="equals"` para Tipo e situação, numérico para Litros — **mais as duas mensagens de vazio distintas** (sem cadastro × sem resultado de filtro), em `frontend/src/app/domain/local/pages/locais/locais.page.html` (FR-016, FR-021, research D4)
- [ ] T032 [US2] Semear o filtro de situação em "ativo" após a carga, expor o contador exibidos/total e um botão "Limpar filtros" em `frontend/src/app/domain/local/pages/locais/locais.page.ts` (FR-018, FR-019, research D5)
- [ ] T033 [US2] Juntar litros por `localId` num `computed()`, exibindo `0 L` para local sem coleta e `—` quando o agregado estiver indisponível, sem quebrar a lista, em `frontend/src/app/domain/local/pages/locais/locais.page.ts` (FR-020, research D6)
- [ ] T034 [US2] Substituir os botões de texto por menu de ações por linha (ver pontos, editar, arquivar/reativar) em `frontend/src/app/domain/local/pages/locais/locais.page.html` — **melhoria de interface vinda do desenho de referência, sem FR próprio**; se o escopo apertar, é a primeira tarefa a cair
- [ ] T035 [US2] Rodar `npm test -- --watch=false` (verde) no frontend

**Checkpoint**: US1 + US2 funcionando de forma independente.

---

## Phase 5: User Story 3 — Preencher o endereço a partir do CEP (Priority: P3)

**Goal**: CEP válido preenche rua, bairro, cidade e UF; CEP inexistente e serviço indisponível avisam sem bloquear o cadastro.

**Independent Test**: `38408-100` preenche quatro campos; `99999-999` avisa "não encontrado"; rede offline avisa "consulta indisponível"; em todos os casos o cadastro segue possível manualmente (quickstart roteiro 2 — SC-002, SC-004).

### Red → Green — serviço de CEP ⚠️

- [ ] T036 [P] [US3] `cep.api.spec.ts` — os três comportamentos **verificados** do ViaCEP: 200 com dados mapeando `logradouro/bairro/localidade/uf`; 200 com corpo `{"erro":"true"}` tratado como não encontrado; falha de rede e timeout tratados como indisponível. **Ver falhar**, em `frontend/src/app/domain/local/apis/cep.api.spec.ts` (FR-010 a FR-013, research D3)
- [ ] T037 [US3] `cep.api.ts` até T036 passar — chamada direta ao ViaCEP **sem** estender `BaseApi` e **sem** `withCredentials`, com `timeout(5000)`; tratar `erro` como *truthy* (o ViaCEP devolve a string `"true"`); ignorar o campo `complemento` do provedor, em `frontend/src/app/domain/local/apis/cep.api.ts` (FR-010, Art. 7.4, research D3)

### Red → Green — autopreenchimento no formulário ⚠️

- [ ] T038 [US3] Ampliar `local-form.component.spec.ts` — CEP completo dispara a consulta e preenche os quatro campos; correção manual prevalece; avisos distintos para não encontrado e indisponível; trocar o CEP reconsulta. **Ver falhar**, em `frontend/src/app/domain/local/components/local-form/local-form.component.spec.ts` (FR-011 a FR-014)
- [ ] T039 [US3] Implementar o autopreenchimento até T038 passar, em `frontend/src/app/domain/local/components/local-form/` (FR-011 a FR-014)
- [ ] T040 [US3] Rodar `npm test -- --watch=false` (verde) no frontend

**Checkpoint**: cadastro com autopreenchimento, degradando sem bloquear.

---

## Phase 6: User Story 4 — Cadastrar e editar sem perder a lista de vista (Priority: P3)

**Goal**: o cadastro acontece em painel sobreposto, com breadcrumb, título e botões sempre visíveis, à direita no desktop e de baixo para cima no mobile.

**Independent Test**: rolar o formulário mantém título e botões visíveis; abaixo de 768 px o painel sobe de baixo; em 360 px não há rolagem horizontal; cancelar não salva (quickstart roteiro 4 — SC-008, SC-009).

### Red → Green — componente compartilhado ⚠️

- [ ] T041 [P] [US4] `form-drawer.component.spec.ts` — posição `right` em ≥ 768 px e `bottom` abaixo disso; header e footer permanecem fora da área de rolagem; `salvarDesabilitado` desabilita o botão; `cancelar` emite sem salvar. **Ver falhar**, em `frontend/src/app/widget/components/form-drawer/form-drawer.component.spec.ts` (FR-022 a FR-026)
- [ ] T042 [US4] `form-drawer.component.ts` até T041 passar — `p-drawer` com templates `#header` (breadcrumb via `p-breadcrumb` + título) e `#footer` (ações), `<ng-content>` no corpo, entradas `visivel`/`titulo`/`trilha`/`salvarDesabilitado`/`salvando`, saídas `salvar`/`cancelar`, e `matchMedia('(min-width: 768px)')` alternando a posição — **768 px vem da tabela de breakpoints de `docs/design.md`**, em `frontend/src/app/widget/components/form-drawer/` (FR-022 a FR-024, research D8)

### Red → Green — migração do formulário ⚠️

- [ ] T043 [US4] Atualizar `local-form.component.spec.ts` — o formulário renderiza dentro do `form-drawer`, com a trilha `Home › Locais › Novo` (ou `› Editar`). **Ver falhar**, em `frontend/src/app/domain/local/components/local-form/local-form.component.spec.ts` (FR-021, FR-022)
- [ ] T044 [US4] Migrar `local-form` de `p-dialog` para o `form-drawer` até T043 passar, em `frontend/src/app/domain/local/components/local-form/` (FR-022)
- [ ] T045 [US4] Rodar `npm test -- --watch=false` (verde) e `npm run build` (sem erro) no frontend

**Checkpoint**: as quatro histórias entregues, cada uma testável isoladamente.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T046 [P] Executar o roteiro de `specs/006-endereco-estruturado-locais/quickstart.md`, conferindo explicitamente **SC-001 a SC-009** e a V6 numa base **com** dados e numa base **vazia** (FR-008)
- [ ] T047 [P] Revisão de segurança e conformidade — validação reprovando pelo servidor via `curl` contornando o formulário (FR-009); erros sem vazar detalhe interno, inclusive os originados no ViaCEP (FR-030); **nenhuma superfície pública passa a expor endereço detalhado** (FR-031); cookie de sessão e token CSRF **não** enviados ao ViaCEP (Art. 7.4); RLS ainda habilitada na `local`; **todos os rótulos e mensagens novos em pt-BR** (FR-027)
- [ ] T048 [P] Registrar os três padrões de UI desta feature (menu de funil por coluna, painel de cadastro com header/footer fixos, autocomplete com criação sobreposta) em `docs/design.md`, para as telas de Pontos e Coletas não divergirem
- [ ] T049 Validação final — `mvn verify` no Docker **e** `npm test -- --watch=false`, ambos verdes, e CI verde antes do merge (Art. 5.5)

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T012)** → **US1 (T013–T026)** → **US2 (T027–T035)** → **US3 (T036–T040)** → **US4 (T041–T045)** → **Polish (T046–T049)**.
- A Foundational bloqueia tudo: sem a V6 e a entidade nova, o backend não sobe (`ddl-auto: validate`) e a suíte não compila.
- **T008 (enum `Uf`) e T009 (migração V6) são pré-requisito de todo o backend**; **T011 (DTOs) é pré-requisito de todo o frontend**, porque define o contrato que a interface consome.
- Dentro de cada história, os pares são explícitos: **T020→T021**, **T022→T023**, **T024→T025**, **T027→T028**, **T029→T030/T031/T032/T033**, **T036→T037**, **T038→T039**, **T041→T042**, **T043→T044**. O teste é tarefa própria e vem antes.
- US2, US3 e US4 dependem da base de US1, mas cada uma é incremento demonstrável por si: a lista filtrável funciona sem o autopreenchimento, e o painel funciona sem os filtros.

### Paralelismo

- Setup: T001 e T002 juntas.
- Foundational: T004 a T007 (fixtures) em paralelo entre si e com T003; T008 e T009 em paralelo; T011 em paralelo com T010.
- US1: T013 e T014 (testes de backend) em paralelo; T018 e T019 em paralelo com eles.
- US2: T027 e T029 (testes) em paralelo.

## Parallel Example: Foundational

```text
# Red — reescrita por regra (isolada, muda asserções):
T003  LocalRepositoryTest

# Red — ajuste mecânico de fixture, quatro frentes sem conflito de arquivo:
T004  test/.../ponto/    (3 arquivos)
T005  test/.../coleta/   (3 arquivos)
T006  test/.../impacto/  (3 arquivos)
T007  test/.../SecurityCsrfTest.java

# Green — enum e migração não se tocam:
T008  Uf.java
T009  V6__endereco_estruturado.sql
```

## Implementation Strategy

1. **MVP = US1**: Setup → Foundational → US1 → validar pelo roteiro 1 do quickstart. Já é demonstrável: cadastro e edição com endereço estruturado.
2. **Incrementos**: US2 (visão geral), US3 (CEP) e US4 (painel), cada um com seu ciclo TDD e checkpoint.
3. **Uma otimização possível, com tradeoff explícito**: as fases seguem a prioridade do spec, então US1 entrega o formulário ainda dentro do `p-dialog` atual e US4 troca o invólucro depois — T022/T023 e depois T043/T044 mexem no mesmo componente. Se as quatro histórias forem entregues na mesma leva, que é o plano, **antecipar T041/T042 (o `form-drawer`) para logo após a Foundational** evita embrulhar o formulário duas vezes. O custo de antecipar é perder US4 como fatia demonstrável isolada; o custo de não antecipar é retrabalho no invólucro, nunca no conteúdo dos nove campos. Decisão de quem executa.
4. **Commits**: por tarefa ou grupo lógico, em Conventional Commits + gitmoji (`:white_check_mark:` testes, `:sparkles:` feature, `:recycle:` refactor, `:lipstick:` interface).
5. **Promoção**: acumular em `develop`; promover `develop → homolog → main` em lote ao fechar a feature, sempre por PR com CI verde (Art. 6.3).

## Notes

- Conferir que cada teste **falha** antes de implementar (Red). Um teste que passa de primeira não está testando o que se pensa.
- `[P]` = arquivos diferentes, sem dependência pendente.
- Backend roda só no Docker (Art. 1.6); frontend no host.
- Todo componente Angular passa pela skill `angular-developer` + MCP do PrimeNG — não reimplementar o que a biblioteca já entrega.
- O empilhamento de drawers (drawer sobre drawer) **não é exercitado nesta feature**: Local não tem campo derivado. A validação acontece na tela de Pontos (research D8).
