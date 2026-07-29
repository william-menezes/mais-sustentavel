# Implementation Plan: Cadastrar Local (CA-01)

**Branch**: `002-cadastro-locais` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-cadastro-locais/spec.md`

## Summary

CRUD de **Local** (instituição atendida) pelo Gestor autenticado, com **arquivamento por soft delete** (RN-G-06 / Art. 2.6). O backend ganha um novo módulo em camadas `br.com.maissustentavel.api.local` (domínio → repositório → serviço → web), esquema versionado via **Flyway `V3`** (Hibernate só valida — `ddl-auto=validate`), **RLS** habilitada na tabela `local` como baseline (Art. 7.2) e **validação de entrada** com Bean Validation (Art. 7.6). O frontend Angular ganha a página `/locais` (listagem de ativos com alternância para arquivados + formulário de cadastro/edição em diálogo), consumindo `/api/locais` com sessão por cookie. Tudo sob **TDD** (testes primeiro; backend no Docker com Testcontainers, frontend no runner Vitest).

A feature reaproveita a fundação da AC-01 (autenticação por sessão, infra de teste com Testcontainers, design system em `styles.scss`). Como introduz os **primeiros endpoints de escrita autenticados**, também **endurece a autenticação existente** — **sem migrar o mecanismo**: mantém a sessão (cookie `JSESSIONID`, já `HttpOnly`) e adiciona **proteção CSRF** (double-submit `XSRF-TOKEN`/`X-XSRF-TOKEN`) e **CORS restrito** a origens conhecidas. No frontend, um `HttpInterceptor` de 401 redireciona ao login.

## Technical Context

**Language/Version**: Java 21 (backend) · TypeScript/Angular 22 (frontend)

**Primary Dependencies**: Spring Boot 4.1 (Web MVC, Data JPA, Security, **Validation**, Actuator), Flyway, driver PostgreSQL, Lombok. Frontend: Angular 22 standalone + signals, **PrimeNG 22** (Table, Dialog, Select, InputText, Button, Tag/SelectButton, Message, Toast), `@primeng/themes` (Aura). Todas as dependências já presentes no projeto — **sem novas libs**.

**Storage**: PostgreSQL — **Supabase** (homolog/prod, com RLS) e Postgres local via `infra/docker-compose.yml` (dev). Extensão `pgcrypto` (`gen_random_uuid()`) já habilitada no `V1`.

**Testing**: Backend — JUnit 5 + Spring Boot Test + **Testcontainers (PostgreSQL)** rodando no Docker (Art. 1.6), Flyway aplicando as migrações no container. Frontend — `@angular/build:unit-test` (Vitest), `*.spec.ts`.

**Target Platform**: contêiner Linux (Docker) na Render (API); Vercel (frontend); banco no Supabase.

**Project Type**: web (API `api/` + SPA `frontend/`), desacoplados.

**Performance Goals**: sem metas específicas (projeto acadêmico, baixa escala).

**Constraints**: `ddl-auto=validate` (esquema é do Flyway); soft delete obrigatório (sem hard delete); segredos só em env; nomes/artefatos/UI em pt-BR (Art. 8).

**Scale/Scope**: baixa escala; 1 entidade nova (`local`), 6 operações REST, 2 telas Angular.

## Constitution Check

*GATE: passar antes da Fase 0. Re-checar após a Fase 1.*

| Artigo | Exigência | Situação no plano |
|--------|-----------|-------------------|
| 1.1 | Backend OO em camadas (controller→service→repository→domínio) | ✅ módulo `local` com `domain/`, `repository/`, `service/`, `web/`; regra de arquivamento no serviço, não no controller |
| 1.2 / 7.2 | Postgres no Supabase com RLS | ✅ `V3` habilita RLS na tabela `local` (baseline, sem política anônima — mesma abordagem do `V2`) |
| 1.6 | Java só no Docker | ✅ build e testes no Docker (Testcontainers) |
| 2.6 | Soft delete para Local | ✅ coluna `arquivado`; arquivar/reativar alternam o flag; **nunca** DELETE físico |
| 3.3 | Critérios de aceite em Gherkin | ✅ na spec (3 user stories) — fonte dos testes de integração |
| 5 | TDD obrigatório (teste antes do código) | ✅ tasks de teste antecedem implementação, back e front |
| 7.3 | Rate limiting em endpoints públicos/auth | ➖ **N/A justificado**: `/api/locais` é interno e exige sessão autenticada; não é superfície pública nem de autenticação. Registrado em `research.md` (D4) |
| 7.4 / 7.5 | Sessão segura; anti-CSRF; CORS restrito | ✅ sessão em cookie **`HttpOnly`** (default); **CSRF habilitado** (double-submit) para as escritas; **CORS** restrito a origens conhecidas via env (D8/D9) |
| 7.6 | Validação de entrada na fronteira da API | ✅ Bean Validation (`@NotBlank`/`@NotNull`) + tipo restrito por `enum` e `CHECK` no banco |
| 8 | pt-BR | ✅ tabela/colunas, código de UI e mensagens em pt-BR |

**Resultado do gate**: PASS — sem violações. O único item não aplicável (7.3 rate limiting) está justificado e documentado, não é uma violação.

## Project Structure

### Documentation (this feature)

```text
specs/002-cadastro-locais/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões (D1..D5)
├── data-model.md        # Fase 1 — entidade Local, tabela, RLS, validações
├── quickstart.md        # Fase 1 — como validar ponta a ponta
├── contracts/
│   └── locais.md        # Fase 1 — contrato REST /api/locais
├── checklists/
│   └── requirements.md  # (do /speckit-specify)
└── tasks.md             # Fase 2 — gerado pelo /speckit-tasks
```

### Source Code (repository root)

```text
api/
├── src/main/java/br/com/maissustentavel/api/
│   ├── local/                         # NOVO módulo (cadastro de locais)
│   │   ├── domain/
│   │   │   ├── Local.java             # @Entity (id UUID, nome, endereco, tipo enum, arquivado, criadoEm)
│   │   │   └── TipoLocal.java         # enum: CONDOMINIO, ESCOLA, EMPRESA, ESPACO_PUBLICO, OUTRO
│   │   ├── repository/
│   │   │   └── LocalRepository.java   # JpaRepository (findByArquivadoFalse / findByArquivadoTrue)
│   │   ├── service/
│   │   │   ├── LocalService.java      # regras: criar/editar/arquivar/reativar/listar
│   │   │   └── LocalNaoEncontradoException.java  # → 404
│   │   └── web/
│   │       ├── LocalController.java   # /api/locais (POST, GET, GET/{id}, PUT/{id}, POST .../arquivar|reativar)
│   │       └── dto/
│   │           ├── LocalRequest.java  # entrada (nome, tipo, endereco) + Bean Validation
│   │           └── LocalResponse.java # saída (id, nome, tipo, endereco, arquivado, criadoEm)
│   ├── config/
│   │   ├── SecurityConfig.java        # ALTERA: habilita CSRF (CookieCsrfTokenRepository) + .cors(); autorização inalterada
│   │   ├── CorsConfig.java            # NOVO: CorsConfigurationSource (origens via env, credenciais)
│   │   └── CsrfCookieFilter.java      # NOVO: força a emissão do cookie XSRF-TOKEN (carregamento diferido)
│   │   # (handler global de erros fica em local/web/ — research D5)
├── src/main/resources/db/migration/
│   └── V3__modelo_local.sql           # NOVO: create table local + CHECK do tipo + índice + RLS
└── src/test/java/br/com/maissustentavel/api/local/
    ├── LocalRepositoryTest.java       # persistência + filtro ativo/arquivado (Testcontainers)
    ├── LocalServiceTest.java          # regras de soft delete/validação/idempotência
    └── LocalControllerTest.java       # integração REST + autenticação (MockMvc)

frontend/
├── src/app/local/                     # NOVO
│   ├── local.service.ts               # HttpClient withCredentials → /api/locais
│   ├── local.model.ts                 # tipos TS (Local, TipoLocal, rótulos pt-BR)
│   ├── local-list/                    # listagem (Table) + alternância ativos/arquivados + ações
│   │   ├── local-list.ts|html|scss
│   │   └── local-list.spec.ts
│   └── local-form/                    # cadastro/edição em Dialog
│       ├── local-form.ts|html|scss
│       └── local-form.spec.ts
├── src/app/core/
│   └── auth-erro.interceptor.ts       # NOVO: 401 → redireciona /login (HttpInterceptor)
├── src/app/app.routes.ts              # + rota lazy '/locais' (protegida por sessão; 401 → login)
├── src/app/app.config.ts              # + registra o interceptor; withXsrfConfiguration se necessário
└── (styles.scss / design tokens já existentes)
```

**Structure Decision**: web (Opção 2). Backend com novo módulo `local` em camadas, espelhando o módulo `auth` da AC-01. Frontend com pasta `local` seguindo o padrão de `auth` (componentes standalone + serviço). Sem mudanças de infraestrutura (mesmo `docker-compose`, mesmo `Dockerfile`, mesmo CI).

## Complexity Tracking

> Sem violações da constituição — seção não aplicável.
