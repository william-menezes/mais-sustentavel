# Implementation Plan: Registrar Coleta (OP-03)

**Branch**: `004-registro-coleta` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-registro-coleta/spec.md`

## Summary

Modelar **Coleta** (medição real de litros) com relação **N:1** a partir do **Ponto** (CA-02). Registro **direto** (sem solicitação/estados) em **ponto ativo** (arquivado → 409): litros reais > 0 + data não futura. A coleta é **imutável** (append-only) e compõe o **total de litros** do ponto — base do valor social (o cálculo em R$/agregação é a IS-01, fora daqui). "Quem registrou" = usuário autenticado (auditoria; campo `coletor` nullable, future-ready para o papel Coletor — AC-03).

Reaproveita a fundação (auth por sessão, CSRF, CORS, Testcontainers, design system). Backend em camadas + migração Flyway **V5** com **RLS**. Frontend: tela de coletas de um ponto (total + lista + registrar), acessível a partir da tela de Pontos.

## Technical Context

**Language/Version**: Java 21 (backend); TypeScript/Angular 22 (frontend).

**Primary Dependencies**: Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation), Flyway, PostgreSQL driver. Sem dependência nova. Frontend: PrimeNG 22 (DatePicker/InputNumber para o formulário).

**Storage**: PostgreSQL (Supabase homolog/prod; Postgres local dev). Tabela nova `coleta`. `ddl-auto=validate`.

**Testing**: JUnit 5 + Spring Boot Test + Testcontainers (Docker). Frontend: Vitest.

**Target Platform**: contêiner Linux (Render) + Supabase; frontend Vercel.

**Constraints**: `ddl-auto=validate`; litros em BigDecimal (> 0); data não futura; pt-BR.

**Scale/Scope**: baixa escala; N coletas por ponto. Esta feature: 1 tabela + entidade/repo/service/controller + tela.

## Constitution Check

*GATE: passar antes da Fase 0. Re-checar após a Fase 1.*

| Artigo | Exigência | Situação no plano |
|--------|-----------|-------------------|
| 1.1 | Backend OO em camadas | ✅ módulo `coleta` (domain/repository/service/web) |
| 1.2 / 7.2 | Postgres Supabase com RLS | ✅ tabela `coleta` com RLS baseline |
| 1.6 | Java só no Docker | ✅ build/testes no Docker |
| 2.1 (RN-G-01) | Trilho de litros reais | ✅ Coleta = medição real (litros reais); não se mistura com declarado |
| 2.2 (RN-G-02) | Valor social sobre a medição real | ✅ Coleta alimenta o total de litros; cálculo em R$ = IS-01 |
| RN-G-12 | Quantidade em litros | ✅ `litros_reais` (numeric) |
| 5 | TDD obrigatório | ✅ testes antes da implementação |
| 7.4 / 7.5 | Sessão; anti-CSRF; CORS | ✅ reaproveita a config da CA-01; `/api/**` de coleta exige autenticação |
| 7.6 | Validação de entrada | ✅ Bean Validation (`@Positive`, `@PastOrPresent`) + CHECK no banco |
| 8 | pt-BR | ✅ tabela/colunas, UI e mensagens em pt-BR |

**Resultado do gate**: PASS — sem violações.

## Project Structure

### Documentation (this feature)

```text
specs/004-registro-coleta/
├── plan.md · research.md · data-model.md · quickstart.md
├── contracts/coletas.md
└── tasks.md   # /speckit-tasks
```

### Source Code (repository root)

```text
api/
├── src/main/java/br/com/maissustentavel/api/coleta/          # NOVO módulo
│   ├── domain/Coleta.java             # @Entity (id UUID, @ManyToOne Ponto, litrosReais, data, @ManyToOne Usuario coletor nullable, criadoEm @Generated)
│   ├── repository/ColetaRepository.java  # findByPonto_IdOrderByDataDesc; somaLitrosByPontoId (@Query coalesce)
│   ├── service/
│   │   ├── ColetaService.java         # registrar(pontoId, req, coletorEmail): valida ponto ATIVO + resolve coletor; listar+total
│   │   ├── PontoIndisponivelException.java  # ponto arquivado → 409
│   │   └── (reusa PontoNaoEncontradoException de ponto/service → 404)
│   └── web/
│       ├── ColetaController.java      # /api/pontos/{pontoId}/coletas (POST/GET)
│       ├── ColetaExceptionHandler.java   # PontoIndisponivelException → 409
│       └── dto/ (ColetaRequest {litrosReais, data}; ColetaResponse; ColetasDoPontoResponse {totalLitros, coletas})
├── src/main/resources/db/migration/V5__modelo_coleta.sql     # tabela coleta + FK + CHECK + índice + RLS
└── src/test/java/.../coleta/          # ColetaRepositoryTest, ColetaServiceTest, ColetaControllerTest

frontend/
├── src/app/coleta/                    # NOVO
│   ├── coleta.model.ts / coleta.service.ts
│   ├── coleta-list/                   # total + lista de coletas do ponto
│   └── coleta-form/                   # diálogo registrar (litros + data)
├── src/app/app.routes.ts              # + rota '/pontos/:pontoId/coletas' (lazy)
└── src/app/ponto/ponto-list/…         # + ação "Coletas" por ponto (navega para as coletas)
```

**Structure Decision**: web service (Opção 2). Módulo `coleta` espelha `ponto`. Endpoints aninhados sob o ponto (`/api/pontos/{pontoId}/coletas`), pois a coleta só existe no contexto de um ponto.

## Complexity Tracking

> Sem violações da constituição — seção não aplicável.
