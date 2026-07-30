# Tarefas — Cálculo do valor social (IS-01)

**Feature**: `005-valor-social` | **Spec/Plan/Contrato/Data-model**: nesta pasta.
Convenção: `[P]` = paralelizável (arquivos distintos, sem dependência pendente). **TDD** (Art. 5): testes antes da implementação.
**Backend puro** — nenhum arquivo em `frontend/`. **Sem migração** (lê da `coleta`; RN-G-06: não filtra por arquivamento).

Pacote base: `api/src/main/java/br/com/maissustentavel/api/impacto/`
Testes: `api/src/test/java/br/com/maissustentavel/api/impacto/`

## Phase 1: Setup

Sem fase de setup dedicada: reaproveita módulo/segurança/Testcontainers das features anteriores. Nenhuma dependência ou config nova.

## Phase 2: Foundational (bloqueia as histórias) 🎯

**Objetivo**: base de agregação (repositório + projeções + DTOs + service com conversão/validação) que as três consultas compartilham.

### Testes (TDD) ⚠️
- [x] T001 [P] `ImpactoRepositoryTest` — semeia `Local`/`Ponto`/`Coleta`; verifica: soma total com `coalesce` (0 sem coletas); agregação por local (`LEFT JOIN` a partir de `Local`, `group by`, ordenação por nome) — **local ativo sem coletas aparece com 0**; **local arquivado sem coletas não aparece**, mas **arquivado com coletas aparece** (RN-G-06); série mensal (`year`/`month`, `group by`, ordem cronológica); filtro `de`/`ate` inclusivo (bordas) e nuláveis, com o filtro de data no `ON` do join preservando as linhas-zero. Em `api/src/test/java/.../impacto/ImpactoRepositoryTest.java`. `@Transactional`.
- [x] T002 [P] `ImpactoServiceTest` — conversão `valorSocial = litros × R$ 1,00` (escala 2, `HALF_UP`); reconciliação (Σ por local == Σ mensal == total) no mesmo período; estado vazio → total 0 e listas vazias; `de > ate` → `PeriodoInvalidoException`; formatação `competencia = "YYYY-MM"`. Em `api/src/test/java/.../impacto/ImpactoServiceTest.java`. `@Transactional`.

### Implementação — base de agregação
- [x] T003 `ImpactoRepository` (`Repository<Coleta, UUID>`) com JPQL parametrizado + predicados nuláveis `(:de is null or c.data >= :de) and (:ate is null or c.data <= :ate)`: `somarLitros(de, ate)` (filtro no `where`); `agregarPorLocal(de, ate)` → `List<LocalAgregado>` — **parte de `Local` com `LEFT JOIN Ponto ... LEFT JOIN Coleta ... on (... filtro de data)`**, `group by l.id, l.nome, l.arquivado`, `having (l.arquivado = false or coalesce(sum(...),0) > 0)`, `order by l.nome`; `agregarMensal(de, ate)` → `List<MensalAgregado>` (filtro no `where`). Projeções de interface `LocalAgregado`/`MensalAgregado` no mesmo pacote. Em `api/.../impacto/repository/`.
- [x] T004 [P] DTOs de resposta: `ValorSocialResponse(litrosReais, valorSocial)`, `ValorSocialLocalResponse(localId, localNome, litrosReais, valorSocial)`, `ValorSocialMensalResponse(competencia, litrosReais, valorSocial)` em `api/.../impacto/web/dto/`.
- [x] T005 [P] `PeriodoInvalidoException` (RuntimeException) em `api/.../impacto/service/`.
- [x] T006 `ImpactoService` — constante `TAXA = BigDecimal.ONE`; `valorSocial(litros)` = `litros.multiply(TAXA).setScale(2, HALF_UP)`; valida período (`de`/`ate` ⇒ `de ≤ ate`, senão `PeriodoInvalidoException`) antes de consultar; métodos `total(de,ate)`, `porLocal(de,ate)`, `mensal(de,ate)` mapeando projeções→DTOs e formatando `competencia`. `@Transactional(readOnly = true)`. Em `api/.../impacto/service/ImpactoService.java`.

**Checkpoint**: agregação + conversão + validação prontas e verdes (repository + service). As três histórias abaixo só expõem isso via HTTP.

## Phase 3: User Story 1 — Valor social total (P1) 🎯 MVP

### Testes (TDD) ⚠️
- [x] T007 [P] [US1] `ImpactoControllerTest` (US1) — `GET /api/impacto/valor-social` → **200** `{litrosReais, valorSocial}` (valor = litros × 1,00); sem coletas → zeros; **401** sem sessão; `de > ate` → **400** `{"erro":"Período inválido"}`; `de=abc` → **400** `{"erro":"Dados inválidos"}`. Em `api/src/test/java/.../impacto/ImpactoControllerTest.java`. `@Transactional`.

### Implementação
- [x] T008 [US1] `ImpactoController` com `GET /api/impacto/valor-social` (params `@RequestParam(required=false) LocalDate de, ate`) → `ImpactoService.total`. Em `api/.../impacto/web/ImpactoController.java`.
- [x] T009 [US1] `ImpactoExceptionHandler` (`@RestControllerAdvice`) — `PeriodoInvalidoException` → 400 "Período inválido"; `MethodArgumentTypeMismatchException` → 400 "Dados inválidos" (reusa `ErroResponse`). Em `api/.../impacto/web/ImpactoExceptionHandler.java`.
- [x] T010 [US1] `mvn -B clean verify` no Docker → US1 verde.

**Checkpoint**: total geral consultável e seguro. MVP demonstrável.

## Phase 4: User Story 2 — Valor social por local (P2)

### Testes (TDD) ⚠️
- [x] T011 [P] [US2] `ImpactoControllerTest` (US2) — `GET /api/impacto/valor-social/por-local` → **200** lista por local ordenada por nome; cada linha com seus litros/valor; **local ativo sem coletas aparece com 0**; **Σ valorSocial == total** (linhas-zero somam zero); sem nenhum local → `[]`; filtro `de`/`ate` aplicado (linha-zero preservada no período).
- [x] T012 [P] [US2] `ImpactoRepositoryTest`/`ImpactoServiceTest` (US2) — reforça: arquivado **com** coletas soma (RN-G-06) e aparece; arquivado **sem** coletas não aparece; ativo sem coletas aparece com 0.

### Implementação
- [x] T013 [US2] `GET /api/impacto/valor-social/por-local` no `ImpactoController` → `ImpactoService.porLocal`.
- [x] T014 [US2] `mvn -B clean verify` no Docker → US1+US2 verdes.

## Phase 5: User Story 3 — Valor social por período (P3)

### Testes (TDD) ⚠️
- [x] T015 [P] [US3] `ImpactoControllerTest` (US3) — filtro por intervalo inclusivo nos três endpoints (bordas `de`/`ate`; só extremo inicial; só final); `GET .../mensal` → **200** série `{competencia:"YYYY-MM",...}` cronológica; **Σ valorSocial mensal == total**; intervalo sem coletas → total 0 / `[]`.

### Implementação
- [x] T016 [US3] `GET /api/impacto/valor-social/mensal` no `ImpactoController` → `ImpactoService.mensal` (o filtro `de`/`ate` já é transversal aos três endpoints via service/repository).
- [x] T017 [US3] `mvn -B clean verify` no Docker → backend completo verde.

## Phase 6: Polish

- [x] T018 [P] Revisão de segurança: 401 sem sessão nos três endpoints; GET sem CSRF (confirmar); mensagens genéricas pt-BR; consultas parametrizadas (sem SQL dinâmico); confirmar que `/api/impacto/**` não foi aberto no `SecurityConfig`.
- [~] T019 Executar o `quickstart.md` (validação ao vivo por API): total, por local, mensal, filtro, estado vazio, arquivado preserva, 401/400. — *em andamento (testes de integração Testcontainers cobrem todos os cenários; falta o smoke ao vivo).*
- [x] T020 `mvn -B clean verify` (Docker) final verde (todas as suites, incluindo as das features anteriores).

## Dependencies & Execution Order

- **Foundational (T001–T006)** → **US1 (T007–T010)** → **US2 (T011–T014)** → **US3 (T015–T017)** → **Polish (T018–T020)**.
- Depende da **OP-03** (`Coleta`) já em `develop`. Segurança/validação/erros reaproveitam a fundação — sem nova fase de segurança nem migração.
- Dentro da fundação: T001/T002 (testes) antes de T003–T006; T004/T005 são `[P]` entre si; T003 antes de T006 (service usa o repositório).

## Parallel Opportunities

- **Testes de fundação**: T001 e T002 em paralelo (arquivos distintos).
- **Artefatos de fundação**: T004 (DTOs) e T005 (exceção) em paralelo; T003 (repositório) independe de ambos.
- **Testes de história**: T007, T011, T012, T015 podem ser escritos em paralelo (mesmo arquivo de teste do controller — coordenar se editados juntos; repository/service test são arquivos distintos).

## Independent Test Criteria

- **US1**: `GET /api/impacto/valor-social` devolve `valorSocial == litros × 1,00`; zeros sem coletas; 401 sem sessão; 400 em período inválido.
- **US2**: `GET .../por-local` soma por local reconcilia com o total; ordena por nome; `[]` quando vazio.
- **US3**: filtro `de`/`ate` inclusivo restringe corretamente (bordas); `.../mensal` agrega por ano-mês em ordem; reconcilia com o total.

## Implementation Strategy

1. **MVP = Foundational + US1**: base de agregação + total geral consultável. Já demonstra o valor social (RN-G-02).
2. US2 (por local) e US3 (período: filtro + mensal) reusam a mesma base.
3. Acumula em `develop`; **promoção em lote** ao fim da Sprint 3 (CA-02 + OP-03 + IS-01) para `homolog`→`main`.
