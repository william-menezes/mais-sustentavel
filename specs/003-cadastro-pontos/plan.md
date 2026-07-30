# Implementation Plan: Cadastrar Ponto de Coleta (CA-02)

**Branch**: `003-cadastro-pontos` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-cadastro-pontos/spec.md`

## Summary

Modelar **Ponto** (estação física) com relação **1:N** a partir de **Local** (RN-G-05), gerando um **QR Code único** por ponto no cadastro. O conteúdo do QR é uma **URL do app** (`<base>/p/{id}`, base por env) — preparando a DG-01 sem implementá-la. A criação só é permitida em **Local ativo**, é **atômica** (falha na geração do QR ⇒ nada persiste) e o ponto usa **soft delete** (arquivar/reativar, RN-G-06).

A feature reaproveita a fundação da CA-01/AC-01 (autenticação por sessão, **CSRF** double-submit, **CORS**, infra de teste Testcontainers, design system). Backend em camadas + migração Flyway **V4** com **RLS**; QR gerado por biblioteca Java (**ZXing**). Frontend Angular/PrimeNG: pontos de um local, cadastro e **exibição/download** do QR.

## Technical Context

**Language/Version**: Java 21 (backend); TypeScript/Angular 22 (frontend).

**Primary Dependencies**: Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation), Flyway, PostgreSQL driver, **ZXing** (`com.google.zxing:core` + `javase`) para o QR. Frontend: PrimeNG 22.

**Storage**: PostgreSQL — Supabase (homolog/prod) e Postgres local (dev). Tabela nova `ponto`. `ddl-auto=validate` (esquema é do Flyway).

**Testing**: JUnit 5 + Spring Boot Test + **Testcontainers (PostgreSQL)** no Docker (Art. 1.6). Frontend: Vitest (`@angular/build:unit-test`).

**Target Platform**: contêiner Linux (Render) + Supabase; frontend na Vercel.

**Project Type**: web service (API `api/`) + SPA (`frontend/`).

**Constraints**: `ddl-auto=validate`; base da URL do QR por env; segredos só em env; pt-BR.

**Scale/Scope**: baixa escala; N pontos por local. Esta feature: 1 tabela + entidade/repo/service/controller + geração de QR + telas.

## Constitution Check

*GATE: passar antes da Fase 0. Re-checar após a Fase 1.*

| Artigo | Exigência | Situação no plano |
|--------|-----------|-------------------|
| 1.1 | Backend OO em camadas | ✅ módulo `ponto` (domain/repository/service/web) |
| 1.2 / 7.2 | Postgres Supabase com RLS | ✅ tabela `ponto` com RLS baseline (como `local`) |
| 1.6 | Java só no Docker | ✅ build/testes no Docker (Testcontainers) |
| 2.5 (RN-G-05) | Local 1:N Ponto; QR único por ponto | ✅ `@ManyToOne` Local; `qr_conteudo` único; id na URL garante unicidade |
| 2.6 (RN-G-06) | Soft delete de Ponto | ✅ `arquivado` boolean; sem hard delete |
| 5 | TDD obrigatório | ✅ testes antes da implementação |
| 7.3 | Rate limiting público/auth | ➖ N/A: endpoints internos autenticados (como na CA-01) |
| 7.4 / 7.5 | Sessão segura; anti-CSRF; CORS | ✅ reaproveita a config da CA-01 (spa/CSRF + CORS); `/api/**` de ponto exige autenticação |
| 7.6 | Validação de entrada | ✅ Bean Validation + verificação de Local ativo no service |
| 8 | pt-BR | ✅ tabela/colunas, UI e mensagens em pt-BR |

**Resultado do gate**: PASS — sem violações. (Decisões em `research.md`.)

## Project Structure

### Documentation (this feature)

```text
specs/003-cadastro-pontos/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões (QR, atomicidade, endpoints)
├── data-model.md        # Fase 1 — entidade Ponto, migração V4, RLS
├── quickstart.md        # Fase 1 — como validar
├── contracts/pontos.md  # Fase 1 — contrato REST
└── tasks.md             # Fase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
api/
├── src/main/java/br/com/maissustentavel/api/ponto/        # NOVO módulo
│   ├── domain/Ponto.java             # @Entity (id, @ManyToOne Local, qrConteudo único, arquivado, criadoEm @Generated)
│   ├── repository/PontoRepository.java  # findByLocalIdAndArquivadoFalse/True
│   ├── service/
│   │   ├── PontoService.java          # criar (valida Local ativo + gera/valida QR, atômico), listar, arquivar, reativar, imagemQr
│   │   ├── GeradorQrCode.java         # encapsula ZXing (conteúdo -> PNG); NÃO persiste imagem
│   │   └── PontoNaoEncontradoException.java / LocalNaoDisponivelException.java
│   └── web/
│       ├── PontoController.java       # /api/locais/{localId}/pontos (POST/GET) + /api/pontos/{id}/(qr|arquivar|reativar)
│       └── dto/ (PontoResponse, ...)  # (reusa handler de erro global existente em local/web)
├── src/main/resources/db/migration/V4__modelo_ponto.sql   # tabela ponto + FK + índice + RLS
└── src/test/java/.../ponto/           # PontoRepositoryTest, PontoServiceTest, PontoControllerTest, GeradorQrCodeTest
   # + pom.xml: dependências ZXing (core, javase)

frontend/
├── src/app/ponto/                     # NOVO
│   ├── ponto.model.ts / ponto.service.ts
│   ├── ponto-list/                    # pontos de um local (ativos/arquivados) + QR (exibir/baixar) + arquivar/reativar
│   └── ponto-form/                    # cadastro de ponto (em dialog)
├── src/app/app.routes.ts              # + rota '/locais/:localId/pontos' (lazy)
└── src/app/local/local-list/…         # + ação "Pontos" por local (navega para os pontos)
```

**Structure Decision**: web service (Opção 2). Módulo `ponto` espelha `local`. Rotas de criação/listagem aninhadas sob o local (`/api/locais/{localId}/pontos`) porque o ponto só existe no contexto de um local; operações sobre o item usam `/api/pontos/{id}`.

## Complexity Tracking

> Sem violações da constituição — seção não aplicável.
