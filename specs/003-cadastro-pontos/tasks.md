# Tarefas — Cadastrar Ponto de Coleta (CA-02)

**Feature**: `003-cadastro-pontos` | **Spec/Plan/Contrato**: nesta pasta.
Convenção: `[P]` = paralelizável (arquivos independentes). **TDD**: as tarefas de teste vêm antes da implementação (Art. 5).

## Phase 1: Setup

- [ ] T001 Adicionar dependências **ZXing** (`com.google.zxing:core` e `com.google.zxing:javase`) ao `api/pom.xml`.
- [ ] T002 Configurar `app.ponto.base-url` em `api/src/main/resources/application.yml` (env `APP_PONTO_BASE_URL`, default `http://localhost:4200`); expor a var em `infra/docker-compose.yml` e `infra/.env.example`.

## Phase 2: Foundational (bloqueia as histórias)

### Testes (TDD) ⚠️
- [ ] T003 [P] `GeradorQrCodeTest` — gera PNG de um conteúdo e **decodifica de volta** com ZXing, conferindo o conteúdo (fidelidade/unicidade), em `api/src/test/java/.../ponto/GeradorQrCodeTest.java` (research D9).
- [ ] T004 [P] `PontoRepositoryTest` — persiste com `local_id`, `findByLocalIdAndArquivadoFalse/True` separa ativos/arquivados, em `api/src/test/java/.../ponto/PontoRepositoryTest.java`.

### Implementação — Backend base
- [ ] T005 [P] Enum/valores não se aplicam — criar entidade `Ponto` (`@Id` UUID sem `@GeneratedValue`, `@ManyToOne Local`, `qrConteudo` único, `arquivado`, `criadoEm` `@Generated(INSERT)`) em `api/.../ponto/domain/Ponto.java` (data-model).
- [ ] T006 Migração Flyway **V4** `api/src/main/resources/db/migration/V4__modelo_ponto.sql` (tabela `ponto` + FK `local_id` + índices + RLS).
- [ ] T007 [P] `PontoRepository` (`findByLocalIdAndArquivadoFalse`, `findByLocalIdAndArquivadoTrue`) em `api/.../ponto/repository/`.
- [ ] T008 [P] `GeradorQrCode` (ZXing: conteúdo → `byte[]` PNG; lança em falha) em `api/.../ponto/service/GeradorQrCode.java`.
- [ ] T009 [P] DTO `PontoResponse` (id, localId, qrConteudo, qrImagemUrl, arquivado, criadoEm) em `api/.../ponto/web/dto/`.
- [ ] T010 [P] Exceções `PontoNaoEncontradoException` (404) e `LocalNaoDisponivelException` (409) em `api/.../ponto/service/`.
- [ ] T011 Registrar os handlers das exceções de Ponto no `GlobalExceptionHandler` existente (404/409), reutilizando `ErroResponse` (research D8).

**Checkpoint**: base de dados + QR + contrato de erros prontos.

## Phase 3: User Story 1 — Cadastrar ponto com QR único (P1) 🎯 MVP

### Testes (TDD) ⚠️
- [ ] T012 [P] `PontoServiceTest` — `criar` em Local ativo persiste com QR único; **Local inexistente → 404**; **Local arquivado → 409**; **falha na geração do QR → rollback** (nada persistido); vários pontos → QRs distintos. Em `api/src/test/java/.../ponto/PontoServiceTest.java`.
- [ ] T013 [P] `PontoControllerTest` (US1) — `POST /api/locais/{localId}/pontos` → **201** + `Location` + `PontoResponse`; `GET .../pontos` lista ativos; **401** sem sessão; 404/409 conforme o local. Em `api/src/test/java/.../ponto/PontoControllerTest.java`.

### Implementação
- [ ] T014 `PontoService.criar(localId)` — valida Local existente+ativo (usa `LocalRepository`), atribui `id` (UUID), monta `qrConteudo` = `base + "/p/" + id`, **gera o QR (valida)**, salva; `@Transactional` (atomicidade). + `listar(localId, arquivados)`. Em `api/.../ponto/service/PontoService.java`.
- [ ] T015 `PontoController` — `POST` e `GET` aninhados em `/api/locais/{localId}/pontos`. Em `api/.../ponto/web/PontoController.java`.
- [ ] T016 `mvn -B clean verify` no Docker → US1 verde.

## Phase 4: User Story 2 — Recuperar o QR (exibir/baixar) (P2)

### Testes (TDD) ⚠️
- [ ] T017 [P] `PontoControllerTest` (US2) — `GET /api/pontos/{id}/qr` → **200** `image/png` com bytes não vazios; mesma imagem em duas chamadas (estável); ponto inexistente → **404**.

### Implementação
- [ ] T018 `PontoService.imagemQr(id)` (recupera o ponto, gera PNG do `qrConteudo` via `GeradorQrCode`) + endpoint `GET /api/pontos/{id}/qr` retornando `image/png`.
- [ ] T019 `mvn -B clean verify` no Docker → US2 verde.

## Phase 5: User Story 3 — Arquivar e reativar (P3)

### Testes (TDD) ⚠️
- [ ] T020 [P] `PontoServiceTest`/`PontoControllerTest` (US3) — arquivar tira dos ativos e preserva; reativar volta; idempotência; inexistente → 404; escrita sem CSRF → 403.

### Implementação
- [ ] T021 `PontoService.arquivar(id)`/`reativar(id)` + endpoints `POST /api/pontos/{id}/arquivar|reativar`.
- [ ] T022 `mvn -B clean verify` no Docker → backend completo verde.

## Phase 6: Frontend (Angular 22 + PrimeNG via skill + MCP)

### Testes (TDD) ⚠️
- [ ] T023 [P] `ponto.service.spec.ts` — `listar/criar/arquivar/reativar` batem nos endpoints certos (`withCredentials`); URL do QR montada.
- [ ] T024 [P] `ponto-list.spec.ts` — carrega pontos do local, alterna ativos/arquivados, chama arquivar/reativar.

### Implementação
- [ ] T025 [P] `ponto.model.ts` (interface `Ponto`) e `ponto.service.ts` (`/api/locais/{id}/pontos`, `/api/pontos/{id}/...`) em `frontend/src/app/ponto/`.
- [ ] T026 `ponto-list` — tabela de pontos (ativos/arquivados via SelectButton), **exibição do QR** (`<img [src]="/api/pontos/{id}/qr">`) e **download**, ações arquivar/reativar, Toast. Via skill angular-developer + MCP PrimeNG.
- [ ] T027 `ponto-form` — diálogo de cadastro (corpo vazio → cria no local) com feedback.
- [ ] T028 Rota lazy `/locais/:localId/pontos` em `frontend/src/app/app.routes.ts`; ação **"Pontos"** por linha em `local-list` navegando para a tela de pontos.
- [ ] T029 `npm test -- --watch=false` + `ng build` verdes.

## Phase 7: Polish

- [ ] T030 [P] Revisão de segurança: 401 sem sessão, 403 sem CSRF, RLS na `ponto`, sem hard delete, mensagens genéricas.
- [ ] T031 Executar o `quickstart.md` (validação ao vivo) e conferir os cenários da spec.
- [ ] T032 `mvn -B clean verify` (Docker) + `npm test`/`ng build` finais verdes.

## Dependencies & Execution Order

- **Setup (T001–T002)** → **Foundational (T003–T011)** → **US1 (T012–T016)** → **US2 (T017–T019)** → **US3 (T020–T022)** → **Frontend (T023–T029)** → **Polish (T030–T032)**.
- Foundational bloqueia as histórias. US2/US3 dependem de US1 (precisa de ponto criado). Frontend depende do backend das US1–US3.
- CSRF/CORS/auth **já existem** (CA-01) — sem nova fase de segurança; escritas de ponto já ficam protegidas.

## Implementation Strategy

1. **MVP = US1**: Setup → Foundational → US1 → validar (cadastrar ponto + QR único, listar). Já demonstrável.
2. Incrementos US2 (recuperar/baixar QR) e US3 (arquivar/reativar).
3. Frontend integrando com a tela de Locais (ação "Pontos").
4. Acumula em `develop`; promoção em lote ao fim da Sprint 3.
