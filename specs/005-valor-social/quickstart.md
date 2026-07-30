# Quickstart — Validação do valor social (IS-01)

Guia de validação **por API** (backend puro; sem UI). Prova os cenários da spec de ponta a ponta contra o Postgres real.

## Pré-requisitos
- API no ar (`docker compose up`), com as migrações V1–V5 aplicadas (Local, Ponto, Coleta).
- Gestor de desenvolvimento: `gestor@maissustentavel.local` / `Gestor@123`.
- Dados semeados: ao menos **2 locais**, cada um com 1 ponto, e coletas em **datas/meses distintos** (ex.: uma em 2026-06, duas em 2026-07). Registre via `POST /api/pontos/{pontoId}/coletas` (OP-03).

## Preparo de sessão
1. `POST /api/auth/login` (com `withCredentials`) → guarda o cookie de sessão.
2. Consultas de impacto são `GET` → não precisam de `X-XSRF-TOKEN`.

## Cenários

### 1. Total geral (US1 / SC-001)
- `GET /api/impacto/valor-social` → **200** `{ litrosReais, valorSocial }`.
- **Esperado**: `valorSocial == litrosReais × 1,00` (2 casas); `litrosReais` = soma de todas as coletas.

### 2. Por local (US2 / SC-002)
- `GET /api/impacto/valor-social/por-local` → **200** lista por local, ordenada por nome.
- **Esperado**: cada linha traz litros/valor do próprio local; **Σ valorSocial das linhas == total** do cenário 1.

### 3. Série mensal (US3b / SC-002)
- `GET /api/impacto/valor-social/mensal` → **200** lista `{ competencia:"YYYY-MM", ... }` em ordem cronológica.
- **Esperado**: uma linha por mês com coletas; **Σ valorSocial da série == total** do cenário 1.

### 4. Filtro por intervalo (US3a / SC-003)
- `GET /api/impacto/valor-social?de=2026-07-01&ate=2026-07-31` → **200**.
- **Esperado**: apenas coletas de julho entram; conferir com datas de borda (`de`/`ate` inclusivos). Repetir em `/por-local` e `/mensal` — o filtro vale para os três.

### 5. Estado vazio (SC-004)
- `GET /api/impacto/valor-social?de=2000-01-01&ate=2000-12-31` → **200** `{ litrosReais: 0, valorSocial: 0.00 }`.
- `/por-local` e `/mensal` no mesmo período → **200** `[]`. Nunca erro.

### 6. Arquivado preserva (SC-005)
- Arquivar um dos pontos/locais que tem coletas (via CA-01/CA-02) e repetir o cenário 1.
- **Esperado**: o total **não muda** — coletas de entidade arquivada continuam somando (RN-G-06).

### 7. Segurança / validação (SC-006)
- Sem cookie de sessão em qualquer endpoint → **401**.
- `GET /api/impacto/valor-social?de=2026-08-01&ate=2026-07-01` (`de > ate`) → **400** `{ "erro": "Período inválido" }`.
- `GET /api/impacto/valor-social?de=abc` (formato inválido) → **400** `{ "erro": "Dados inválidos" }`.

## Testes automatizados (fonte da verdade — Art. 5)
- Backend: `docker run ... maven:3.9-eclipse-temurin-21 mvn -B clean verify` → `ImpactoRepositoryTest`, `ImpactoServiceTest`, `ImpactoControllerTest` verdes (além dos existentes).
- Sem testes de frontend nesta feature (backend puro).

## Referências
- Contrato: [contracts/impacto.md](./contracts/impacto.md)
- Read-model: [data-model.md](./data-model.md)
- Decisões: [research.md](./research.md)
