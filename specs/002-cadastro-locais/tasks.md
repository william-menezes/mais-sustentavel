---
description: "Tarefas de implementação — Cadastrar Local (CA-01)"
---

# Tasks: Cadastrar Local (CA-01)

**Input**: Documentos de projeto em `specs/002-cadastro-locais/`

**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/locais.md, quickstart.md

**Tests**: TDD **obrigatório** (Art. 5) — os testes vêm antes da implementação e devem falhar primeiro (Red → Green → Refactor).

**Organização**: por história de usuário. **MVP = US1 (cadastrar + listar ativos)**. US2 (arquivar) e US3 (editar/reativar) são incrementos independentes sobre a mesma base.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (cadastrar), US2 (arquivar), US3 (editar/reativar)
- Caminhos relativos à raiz do repositório. Backend: `api/`. Frontend: `frontend/`.
- Base de pacote backend: `api/src/main/java/br/com/maissustentavel/api/local/` (abreviado `.../local/`).

---

## Phase 1: Setup

**Purpose**: preparar a estrutura do novo módulo (o esqueleto Spring e o app Angular já existem).

- [ ] T001 [P] Criar a estrutura de pacotes do módulo backend em `.../local/` (subpacotes `domain/`, `repository/`, `service/`, `web/`, `web/dto/`)
- [ ] T002 [P] Criar a pasta do módulo frontend `frontend/src/app/local/` (subpastas `local-list/`, `local-form/`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: persistência e infraestrutura compartilhada por TODAS as histórias. Sem isto, nenhuma história funciona.

> Já pronto no H01/AC-01 e **reaproveitado sem novas tarefas**: Flyway (`V1`/`V2`), `ddl-auto=validate`, Testcontainers, `SecurityConfig` (`/api/locais` já cai em `anyRequest().authenticated()` — research D6, **sem alteração**).

### Teste (TDD — escrever primeiro, ver falhar) ⚠️

- [ ] T003 [P] `LocalRepositoryTest` — persistir um Local; `findByArquivadoFalse` retorna só ativos e `findByArquivadoTrue` só arquivados; `criadoEm` preenchido pelo default, em `api/src/test/java/br/com/maissustentavel/api/local/LocalRepositoryTest.java` (data-model)

### Implementação

- [ ] T004 [P] Enum `TipoLocal` (CONDOMINIO, ESCOLA, EMPRESA, ESPACO_PUBLICO, OUTRO) em `.../local/domain/TipoLocal.java` (FR-003, data-model D1)
- [ ] T005 Entidade `Local` (id UUID, `nome`, `endereco`, `tipo` `@Enumerated(STRING)`, `arquivado` default false, `criadoEm` insertable/updatable=false) em `.../local/domain/Local.java` (depende de T004; FR-001/005/006)
- [ ] T006 [P] `LocalRepository extends JpaRepository<Local, UUID>` com `findByArquivadoFalse()` e `findByArquivadoTrue()` em `.../local/repository/LocalRepository.java` (depende de T005)
- [ ] T007 [P] Migração `V3__modelo_local.sql` — `create table local` + `CHECK` do tipo + índice `local_arquivado_idx` + `enable row level security`, em `api/src/main/resources/db/migration/V3__modelo_local.sql` (FR-003/006, Art. 7.2; data-model)
- [ ] T008 [P] DTOs `LocalRequest` (`@NotBlank nome/endereco`, `@NotNull tipo`) e `LocalResponse` (id, nome, tipo, endereco, arquivado, criadoEm) em `.../local/web/dto/` (FR-002/003; contract)
- [ ] T009 [P] `LocalNaoEncontradoException` + `@RestControllerAdvice` global mapeando validação→400 (`campo→mensagem`) e não encontrado→404, sem vazar detalhes, em `.../local/web/` (FR-010/012, research D5)
- [ ] T010 Rodar `mvn verify` no Docker e deixar `LocalRepositoryTest` (T003) **verde** (valida mapeamento JPA × esquema Flyway `V3`) (depende de T004–T007)

**Checkpoint**: base de dados + persistência + contrato de erros prontos.

---

## Phase 2b: Endurecimento de Autenticação — CSRF/CORS (Blocking para escrita)

**Purpose**: viabilizar com segurança os primeiros endpoints de **escrita** autenticados. Mantém a sessão atual (sem migrar mecanismo) e adiciona CSRF (double-submit) + CORS restrito. Roda **após a Foundational e antes das escritas das histórias** (US1 `POST`, US2/US3). Reaproveita/ajusta a auth da AC-01. (research D8/D9/D10)

### Teste (TDD) ⚠️

- [ ] T041 [P] Teste de segurança — `POST` sem `X-XSRF-TOKEN` → **403**; `POST` com token válido → passa; `GET` não exige token; origem não listada barrada, em `api/src/test/java/br/com/maissustentavel/api/SecurityCsrfTest.java` (FR-014/015, contract)

### Implementação — Backend

- [ ] T042 [P] `CorsConfig` — bean `CorsConfigurationSource` com origens via env (`APP_CORS_ORIGINS`, default `http://localhost:4200`), `allowCredentials(true)`, métodos `GET/POST/PUT/OPTIONS`, headers incl. `X-XSRF-TOKEN`, em `api/.../config/CorsConfig.java` (FR-015, D9)
- [ ] T043 `SecurityConfig` — habilitar `.cors()` e **CSRF** via `CookieCsrfTokenRepository.withHttpOnlyFalse()` + `XorCsrfTokenRequestAttributeHandler` + `CsrfCookieFilter` (força emissão do cookie); autorização inalterada, em `api/.../config/SecurityConfig.java` (FR-014, D8)
- [ ] T044 Ajustar os testes de auth existentes da AC-01 (`AutenticacaoIntegrationTest`, `SecurityConfigTest`) para incluir `.with(csrf())` nos `POST` e manter o login **verde** com CSRF ativo
- [ ] T045 Rodar `mvn verify` no Docker → segurança + auth AC-01 **verdes**

### Implementação — Frontend

- [ ] T046 [P] `auth-erro.interceptor.ts` — `HttpInterceptor` que em **401** redireciona para `/login`; registrar em `frontend/src/app/app.config.ts`; garantir `withCredentials` e fluxo XSRF (Angular envia `X-XSRF-TOKEN` a partir do cookie); + spec, em `frontend/src/app/core/` (D10)
- [ ] T047 Semear o cookie `XSRF-TOKEN` antes do 1º `POST` (ex.: `GET` inicial à API no bootstrap) e validar login + escrita no dev; `npm test` **verde**

**Checkpoint**: escritas autenticadas protegidas (CSRF/CORS) — as histórias com `POST`/`PUT` podem prosseguir.

---

## Phase 3: User Story 1 — Cadastrar um local (Priority: P1) 🎯 MVP

**Goal**: o Gestor cadastra um local (nome, tipo, endereço) e o vê na listagem de ativos; validação impede dados inválidos.

**Independent Test**: autenticado, `POST /api/locais` cria (201) e o local aparece em `GET /api/locais`; requisição sem campo obrigatório ou tipo inválido → 400; sem sessão → 401 (quickstart passos 1–2, 8).

### Tests (TDD) ⚠️

- [ ] T011 [P] [US1] `LocalServiceTest` — `criar` persiste local ativo; `listarAtivos` retorna só ativos, em `api/src/test/java/br/com/maissustentavel/api/local/LocalServiceTest.java` (FR-001/004)
- [ ] T012 [P] [US1] `LocalControllerTest` — `POST /api/locais` 201 + `Location`; validação 400 (nome/endereco vazios, tipo fora da lista); `GET /api/locais` lista ativos; **401 sem sessão**, em `api/src/test/java/br/com/maissustentavel/api/local/LocalControllerTest.java` (FR-002/003/011, contract)

### Implementação — Backend

- [ ] T013 [US1] `LocalService` com `criar(LocalRequest)` e `listarAtivos()` em `.../local/service/LocalService.java` (depende de T005/T006)
- [ ] T014 [US1] `LocalController` — `POST /api/locais` (201+Location), `GET /api/locais` (ativos por padrão), `GET /api/locais/{id}` (200/404) em `.../local/web/LocalController.java` (depende de T013/T008/T009; contract)
- [ ] T015 [US1] Rodar `mvn verify` no Docker → testes de US1 (T011/T012) **verdes**

### Implementação — Frontend (via skill `angular-developer` + MCP PrimeNG)

- [ ] T016 [P] [US1] `local.model.ts` — interface `Local`, tipo `TipoLocal` e mapa de **rótulos pt-BR**, em `frontend/src/app/local/local.model.ts` (FR-013, data-model)
- [ ] T017 [US1] `local.service.spec.ts` (TDD, `HttpTestingController`) e depois `local.service.ts` — `criar`, `listarAtivos` com `withCredentials` → `/api/locais`, em `frontend/src/app/local/`
- [ ] T018 [US1] Componente `local-form` (standalone + signals) — diálogo de cadastro com PrimeNG (Dialog, InputText, Select de tipo, Button, Message), validação e emissão de evento ao salvar; + `local-form.spec.ts`, em `frontend/src/app/local/local-form/`
- [ ] T019 [US1] Componente `local-list` (standalone + signals) — Table de ativos + botão "Novo local" abrindo o `local-form`; + `local-list.spec.ts`, em `frontend/src/app/local/local-list/`
- [ ] T020 [US1] Rota lazy `'/locais'` em `frontend/src/app/app.routes.ts` (protegida por sessão; 401 → redireciona ao login) e, no sucesso do login, navegar para `/locais`
- [ ] T021 [US1] Rodar `npm test` (verde) e `ng build` (sem erro) no frontend

**Checkpoint**: cadastrar + listar ativos funcionando ponta a ponta — **entregável do MVP**.

---

## Phase 4: User Story 2 — Arquivar um local (Priority: P2)

**Goal**: arquivar (soft delete) remove o local das listas ativas preservando o registro; visão de arquivados o mostra; arquivar de novo é idempotente.

**Independent Test**: `POST /api/locais/{id}/arquivar` → some de `GET /api/locais` e aparece em `GET /api/locais?arquivados=true`; segundo arquivamento → 200 sem duplicar (quickstart passos 3–5).

### Tests (TDD) ⚠️

- [ ] T022 [P] [US2] `LocalServiceTest` (+casos) — `arquivar` marca `arquivado=true`, idempotente; `listarArquivados` retorna só arquivados (FR-005/006/010)
- [ ] T023 [P] [US2] `LocalControllerTest` (+casos) — `POST /api/locais/{id}/arquivar` 200 (idempotente); `GET /api/locais?arquivados=true`; 404 para id inexistente (contract)

### Implementação

- [ ] T024 [US2] `LocalService.arquivar(id)` (idempotente, `LocalNaoEncontradoException` se ausente) e `listarArquivados()` em `.../local/service/LocalService.java`
- [ ] T025 [US2] `LocalController` — `POST /api/locais/{id}/arquivar` e parâmetro `arquivados` no `GET /api/locais` em `.../local/web/LocalController.java`
- [ ] T026 [US2] Rodar `mvn verify` no Docker → US2 **verde**
- [ ] T027 [US2] `local.service` — `arquivar` e `listar(arquivados)` (spec primeiro), em `frontend/src/app/local/local.service.ts`
- [ ] T028 [US2] `local-list` — alternância ativos/arquivados (SelectButton), ação "Arquivar" com confirmação e Toast de feedback; atualizar `local-list.spec.ts` (via skill angular-developer + MCP PrimeNG)
- [ ] T029 [US2] Rodar `npm test` (verde) no frontend

**Checkpoint**: US1 + US2 funcionando de forma independente.

---

## Phase 5: User Story 3 — Editar e reativar um local (Priority: P3)

**Goal**: editar nome/tipo/endereço (mesmas validações) e reativar um arquivado (idempotente).

**Independent Test**: `PUT /api/locais/{id}` altera e valida (400/404); `POST /api/locais/{id}/reativar` traz de volta aos ativos (quickstart passos 6–7).

### Tests (TDD) ⚠️

- [ ] T030 [P] [US3] `LocalServiceTest` (+casos) — `editar` altera e valida, 404 se ausente; `reativar` marca `arquivado=false`, idempotente (FR-007/009/010)
- [ ] T031 [P] [US3] `LocalControllerTest` (+casos) — `PUT /api/locais/{id}` 200/400/404; `POST /api/locais/{id}/reativar` 200 (contract)

### Implementação

- [ ] T032 [US3] `LocalService.editar(id, LocalRequest)` e `reativar(id)` em `.../local/service/LocalService.java`
- [ ] T033 [US3] `LocalController` — `PUT /api/locais/{id}` e `POST /api/locais/{id}/reativar` em `.../local/web/LocalController.java`
- [ ] T034 [US3] Rodar `mvn verify` no Docker → US3 **verde**
- [ ] T035 [US3] `local.service` — `editar` e `reativar` (spec primeiro), em `frontend/src/app/local/local.service.ts`
- [ ] T036 [US3] `local-form` em modo edição (pré-preenchido) e `local-list` com ações "Editar" e "Reativar"; atualizar specs (via skill angular-developer + MCP PrimeNG)
- [ ] T037 [US3] Rodar `npm test` (verde) no frontend

**Checkpoint**: CRUD + arquivamento completos, cada história testável isoladamente.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T038 [P] Executar o roteiro do `specs/002-cadastro-locais/quickstart.md` (8 passos) e conferir os cenários da spec
- [ ] T039 [P] Revisão de segurança: 401 sem sessão (SC-005), RLS presente na `V3`, erros sem vazamento (FR-012), **nenhum DELETE físico** em nenhum caminho (Art. 2.6)
- [ ] T040 Validação final: `mvn verify` no Docker **e** `npm test` no frontend, ambos verdes (gate de "pronto" — Art. 5.5)

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T010)** → **Segurança/CSRF (T041–T047)** → **US1 (T011–T021)** → **US2 (T022–T029)** → **US3 (T030–T037)** → **Polish (T038–T040)**.
- Foundational bloqueia todas as histórias (entidade/migração/repositório/DTO/erros).
- **Phase 2b (T041–T047)** bloqueia os endpoints de **escrita** (US1 `POST`, US2 arquivar, US3 editar/reativar): sem CSRF/CORS as escritas autenticadas ficariam expostas. Numeração 41+ apenas por ter sido inserida após o `tasks.md` inicial; a **ordem de execução é esta**.
- Dentro de cada história: **testes primeiro (falham)** → serviço → controller → `mvn verify` verde → frontend (spec → componente) → `npm test` verde.
- US2 e US3 dependem da base de US1 (entidade/serviço/controller já existentes), mas cada uma é um incremento testável e demonstrável por si.

### Paralelismo

- Setup: T001 e T002 em paralelo.
- Foundational: T003 (teste) escrito antes; T004 e T007 (enum e migração) em paralelo; T006/T008/T009 após suas dependências.
- Por história: os dois testes `[P]` (service e controller) em paralelo; no frontend, `local.model.ts` `[P]` em paralelo com os testes de backend.

## Parallel Example: US1

```text
# Testes de US1 juntos (devem falhar primeiro):
T011  LocalServiceTest  (service: criar/listarAtivos)
T012  LocalControllerTest (REST: POST/GET/401)
# Em paralelo, sem conflito de arquivo:
T016  local.model.ts (tipos + rótulos pt-BR)
```

## Implementation Strategy

1. **MVP = US1**: Setup → Foundational → Segurança/CSRF (2b) → US1 → validar (quickstart 1–2, 8). Já é demonstrável (cadastrar + listar).
2. **Incrementos**: US2 (arquivar) e US3 (editar/reativar), cada um com seu ciclo TDD e checkpoint.
3. **Commits**: por tarefa/grupo lógico, em Conventional Commits + gitmoji (`:white_check_mark:` testes, `:sparkles:` feature, `:lock:`/`:lipstick:` quando couber).
4. **Promoção**: acumular em `develop`; promover `develop→homolog→main` em lote ao fechar a sprint (não por fatia).

## Notes

- Verificar que os testes **falham** antes de implementar (Red).
- `[P]` = arquivos diferentes, sem dependência pendente.
- Backend só roda no Docker (Art. 1.6); frontend no host.
- Todo componente Angular passa pela skill `angular-developer` + MCP PrimeNG (não duplicar componentes).
