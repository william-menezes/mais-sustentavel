# Tarefas — Registrar Coleta (OP-03)

**Feature**: `004-registro-coleta` | **Spec/Plan/Contrato**: nesta pasta.
Convenção: `[P]` = paralelizável. **TDD**: testes antes da implementação (Art. 5).
Sem fase de Setup (nenhuma dependência/config nova).

## Phase 1: Foundational (bloqueia as histórias)

### Testes (TDD) ⚠️
- [ ] T001 [P] `ColetaRepositoryTest` — persiste com `ponto_id`; `findByPonto_IdOrderByDataDesc`; soma de litros por ponto (`coalesce`), em `api/src/test/java/.../coleta/ColetaRepositoryTest.java`.

### Implementação — Backend base
- [ ] T002 Entidade `Coleta` (`@GeneratedValue` UUID, `@ManyToOne Ponto`, `litrosReais` BigDecimal, `data` LocalDate, `@ManyToOne Usuario coletor` nullable, `criadoEm` `@Generated`) em `api/.../coleta/domain/Coleta.java`.
- [ ] T003 Migração Flyway **V5** `api/src/main/resources/db/migration/V5__modelo_coleta.sql` (tabela `coleta` + FK ponto/usuario + `CHECK litros_reais > 0` + índice + RLS).
- [ ] T004 [P] `ColetaRepository` (`findByPonto_IdOrderByDataDesc`; `@Query` `coalesce(sum(litros_reais),0)` por ponto) em `api/.../coleta/repository/`.
- [ ] T005 [P] DTOs: `ColetaRequest` (`@NotNull @Positive litrosReais`, `@NotNull @PastOrPresent data`), `ColetaResponse`, `ColetasDoPontoResponse` (totalLitros, coletas) em `api/.../coleta/web/dto/`.

**Checkpoint**: persistência + soma + contrato prontos. (Erros 404 do ponto e 400 de validação reaproveitam os handlers existentes.)

## Phase 2: User Story 1 — Registrar coleta (P1) 🎯 MVP

### Testes (TDD) ⚠️
- [ ] T006 [P] `ColetaServiceTest` — `registrar` valida ponto existente (inexistente → `PontoNaoEncontradoException`); resolve `coletor` por e-mail (associa quando existe, null quando não); persiste litros/data; litros ≤ 0 e data futura são barrados pela validação do DTO (teste de borda no controller). Em `api/src/test/java/.../coleta/ColetaServiceTest.java`.
- [ ] T007 [P] `ColetaControllerTest` (US1) — `POST /api/pontos/{id}/coletas` → **201** + `ColetaResponse`; **400** litros ≤ 0 / data futura / ausente; **404** ponto inexistente; **409** ponto arquivado; **401** sem sessão. Em `api/src/test/java/.../coleta/ColetaControllerTest.java`.

### Implementação
- [ ] T008 `ColetaService.registrar(pontoId, req, coletorEmail)` — valida Ponto existente **e ativo** (`PontoRepository`; inexistente → `PontoNaoEncontradoException` 404, arquivado → `PontoIndisponivelException` 409), resolve coletor (`UsuarioRepository.findByEmail`, nullable), salva (`saveAndFlush`), `@Transactional`. Em `api/.../coleta/service/ColetaService.java`.
- [ ] T009 `ColetaController` (`POST`, repassa o e-mail do usuário autenticado via `Authentication`) + `ColetaExceptionHandler` (`PontoIndisponivelException` → 409). Em `api/.../coleta/web/`.
- [ ] T010 `mvn -B clean verify` no Docker → US1 verde.

## Phase 3: User Story 2 — Consultar coletas e total (P2)

### Testes (TDD) ⚠️
- [ ] T011 [P] `ColetaServiceTest`/`ColetaControllerTest` (US2) — `GET /api/pontos/{id}/coletas` → **200** `{ totalLitros, coletas[] }`; total = soma exata; ponto sem coletas → total 0 e lista vazia; ordenação por data desc.

### Implementação
- [ ] T012 `ColetaService.listarDoPonto(pontoId)` (lista + total via `coalesce(sum)`) + `GET` no controller.
- [ ] T013 `mvn -B clean verify` no Docker → backend completo verde.

## Phase 4: Frontend (Angular 22 + PrimeNG via skill + MCP)

### Testes (TDD) ⚠️
- [ ] T014 [P] `coleta.service.spec.ts` — `registrar` (POST corpo `{litrosReais,data}`) e `listar` batem nos endpoints (`withCredentials`).
- [ ] T015 [P] `coleta-list.spec.ts` — carrega coletas+total do ponto; registrar chama o serviço e recarrega.

### Implementação
- [ ] T016 [P] `coleta.model.ts` + `coleta.service.ts` (`/api/pontos/{id}/coletas`) em `frontend/src/app/coleta/`.
- [ ] T017 `coleta-list` — cabeçalho com **total de litros**, tabela de coletas (data, litros, quem registrou), botão "Registrar coleta". Via skill angular-developer + MCP PrimeNG.
- [ ] T018 `coleta-form` — diálogo com **InputNumber** (litros, > 0) e **DatePicker** (data, máx. hoje) + validação; usa o MCP PrimeNG para esses componentes.
- [ ] T019 Rota lazy `/pontos/:pontoId/coletas`; ação **"Coletas"** por ponto em `ponto-list` navegando para as coletas.
- [ ] T020 `npm test -- --watch=false` + `ng build` verdes.

## Phase 5: Polish

- [ ] T021 [P] Revisão de segurança: 401 sem sessão, 403 sem CSRF, RLS na `coleta`, imutabilidade (sem PUT/DELETE), mensagens genéricas.
- [ ] T022 Executar o `quickstart.md` (validação ao vivo) e conferir os cenários.
- [ ] T023 `mvn -B clean verify` (Docker) + `npm test`/`ng build` finais verdes.

## Dependencies & Execution Order

- **Foundational (T001–T005)** → **US1 (T006–T010)** → **US2 (T011–T013)** → **Frontend (T014–T020)** → **Polish (T021–T023)**.
- Depende da **CA-02** (Ponto) já em `develop`. Erros/validação/CSRF/CORS reaproveitam a fundação — sem nova fase de segurança.

## Implementation Strategy

1. **MVP = US1**: Foundational → US1 → validar (registrar coleta, litros/data válidos). Já demonstrável.
2. US2 (total + lista) e frontend (tela de coletas a partir do ponto).
3. Acumula em `develop`; promoção em lote ao fim da Sprint 3 (após IS-01).
