---
description: "Tarefas de implementação — Fundação de Acesso (AC-01)"
---

# Tasks: Fundação de Acesso (AC-01)

**Input**: Documentos de projeto em `specs/001-fundacao-acesso/`

**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/

**Tests**: TDD **obrigatório** (Art. 5) — os testes vêm antes da implementação e devem falhar primeiro.

**Organização**: por história de usuário. **MVP = US1 (modelagem)**, que é a subtarefa 3 pedida. US2 (login) são as subtarefas 4 e 5, etapas seguintes desta mesma feature.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 (modelagem) ou US2 (login)
- Caminhos de arquivo são relativos à raiz do repositório

---

## Phase 1: Setup

**Purpose**: preparar a estrutura do módulo de acesso (o esqueleto Spring já existe do H01).

- [ ] T001 [P] Criar a estrutura de pacotes do módulo em `api/src/main/java/br/com/maissustentavel/api/acesso/` (subpacotes `domain/` e `repository/`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura que bloqueia as histórias.

> **Fundação já pronta no H01**: Spring Boot em camadas, Flyway (`db/migration/`, com `V1__init.sql`/pgcrypto), `ddl-auto=validate`, Testcontainers (`TestcontainersConfiguration`) e `SecurityConfig`. **Sem novas tarefas foundational.**

**Checkpoint**: fundação pronta — as histórias podem começar.

---

## Phase 3: User Story 1 — Papéis e usuário modelados (Priority: P1) 🎯 MVP

**Goal**: os 4 papéis (Gestor, Responsável, Coletor, Doador) e a entidade Usuario existem no banco, com vínculo N:N e **só Gestor ativo**. É a subtarefa 3 da AC-01.

**Independent Test**: `mvn verify` verde + consulta ao banco: existem os 4 papéis, só Gestor `ativo=true`; um usuário acumula ≥2 papéis; e-mail duplicado é rejeitado (ver quickstart.md).

### Tests for User Story 1 (TDD — escrever primeiro, ver falhar) ⚠️

- [ ] T002 [P] [US1] `PapelRepositoryTest` — após migração há 4 papéis (Gestor, Responsável, Coletor, Doador) e só Gestor `ativo=true`, em `api/src/test/java/br/com/maissustentavel/api/acesso/PapelRepositoryTest.java`
- [ ] T003 [P] [US1] `UsuarioPapelTest` — salvar um usuário com ≥2 papéis (N:N acumula) e rejeitar e-mail duplicado, em `api/src/test/java/br/com/maissustentavel/api/acesso/UsuarioPapelTest.java`

### Implementation for User Story 1

- [ ] T004 [P] [US1] Entidade `Papel` (id UUID, `nome` único, `ativo`) em `api/src/main/java/br/com/maissustentavel/api/acesso/domain/Papel.java`
- [ ] T005 [US1] Entidade `Usuario` (id UUID, `nome`, `email` único, `senhaHash`, `criadoEm`; `@ManyToMany Set<Papel>` via `@JoinTable usuario_papel`) em `api/src/main/java/br/com/maissustentavel/api/acesso/domain/Usuario.java` (depende de T004)
- [ ] T006 [P] [US1] `PapelRepository` (`findByNome`) em `api/src/main/java/br/com/maissustentavel/api/acesso/repository/PapelRepository.java` (depende de T004)
- [ ] T007 [P] [US1] `UsuarioRepository` (`findByEmail`, `existsByEmail`) em `api/src/main/java/br/com/maissustentavel/api/acesso/repository/UsuarioRepository.java` (depende de T005)
- [ ] T008 [P] [US1] Migração `V2__modelo_acesso.sql` — tabelas `papel`/`usuario`/`usuario_papel`, seed dos 4 papéis (só Gestor ativo) e `enable row level security` nas três, em `api/src/main/resources/db/migration/V2__modelo_acesso.sql`
- [ ] T009 [US1] Rodar `mvn verify` no Docker e deixar os testes de US1 **verdes** (`ddl-auto=validate` confirma o mapeamento JPA × esquema Flyway)

**Checkpoint**: modelagem completa e testável — **entregável do MVP**.

---

## Phase 4: User Story 2 — Gestor entra no sistema (Priority: P1) — *etapas seguintes (subtarefas 4 e 5)*

**Goal**: login/logout do Gestor com mensagens genéricas (anti-enumeração), rate limiting e tela.

**Independent Test**: login com credenciais corretas acessa; incorretas e conta inexistente retornam a **mesma** resposta genérica; excesso de tentativas é barrado.

### Tests for User Story 2 (TDD) ⚠️

- [ ] T010 [P] [US2] `AutenticacaoIntegrationTest` — login válido (200), inválido e conta inexistente (401 idêntico), logout (204), em `api/src/test/java/br/com/maissustentavel/api/acesso/AutenticacaoIntegrationTest.java`

### Implementation for User Story 2

- [ ] T011 [US2] Bean `PasswordEncoder` BCrypt + liberar `POST /api/auth/**` no `api/.../config/SecurityConfig.java`
- [ ] T012 [US2] Seed idempotente do Gestor via `SEED_GESTOR_EMAIL`/`SEED_GESTOR_SENHA` (cria só se ausente) em `api/.../acesso/GestorSeeder.java` (sem credencial versionada — research D4)
- [ ] T013 [US2] `AutenticacaoService` (autenticar por e-mail/senha, carregar papéis na sessão) em `api/.../acesso/service/AutenticacaoService.java`
- [ ] T014 [US2] `AutenticacaoController` (`POST /api/auth/login`, `POST /api/auth/logout`; mensagens genéricas pt-BR) em `api/.../acesso/web/AutenticacaoController.java` (contrato: contracts/autenticacao.md)
- [ ] T015 [US2] Rate limiting (Bucket4j) no fluxo de login (FR-010)
- [ ] T016 [US2] Tela de login Angular com feedback de erro genérico, via skill `angular-developer` + MCP PrimeNG e tokens de `docs/design.md`, em `frontend/src/app/...`

**Checkpoint**: login funcional ponta a ponta.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T017 [P] Rodar a validação do `specs/001-fundacao-acesso/quickstart.md` (consultas de papéis e RLS)
- [ ] T018 [P] Atualizar documentação se necessário (ex.: nota de RLS/seed em `docs/`)

---

## Dependencies & Execution Order

- **Setup (T001)** → **US1 (T002–T009)** → **US2 (T010–T016)** → **Polish**.
- Dentro de US1: testes (T002, T003) primeiro (falham) → entidades (T004, T005) → repositórios (T006, T007) → migração (T008) → `mvn verify` verde (T009).
- US2 depende de US1 (usa o modelo). US1 é entregável e demonstrável sozinha (MVP).

### Paralelismo
- T002 e T003 (testes) em paralelo.
- T004 e T008 (entidade Papel e migração) em paralelo; T006/T007 após as entidades.

## Implementation Strategy

1. **MVP = US1**: Setup → US1 → `mvn verify` verde → **PR da modelagem** (branch `001-fundacao-acesso` → `develop`).
2. **Incremento**: US2 (login) em seguida, dentro da mesma feature.
3. Commit por tarefa/grupo lógico, na convenção Conventional Commits + gitmoji.

## Notes
- Verificar que os testes **falham** antes de implementar.
- `[P]` = arquivos diferentes, sem dependência pendente.
- Foco desta rodada: **US1 (T001–T009)**. US2 fica pronta para puxar depois.