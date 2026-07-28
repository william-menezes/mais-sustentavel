# Implementation Plan: Fundação de Acesso (AC-01)

**Branch**: `001-fundacao-acesso` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-fundacao-acesso/spec.md`

## Summary

Modelar o núcleo de acesso do sistema: entidades **Usuario**, **Papel** e o vínculo **N:N** (`usuario_papel`), com os quatro papéis (Gestor, Responsável, Coletor, Doador) semeados e **apenas o Gestor ativo** no MVP. A modelagem é o alicerce da autenticação (login do Gestor) e da evolução futura (papéis já modelados antes da interface).

Abordagem: esquema versionado via **Flyway `V2`** (o Hibernate apenas valida — `ddl-auto=validate`), entidades **JPA** em arquitetura em camadas, **RLS** habilitado como baseline de segurança, e **TDD** com Testcontainers (Postgres real). A primeira etapa entrega a modelagem + seed dos papéis; login/senha (BCrypt), rate limiting e a tela vêm nas etapas seguintes desta mesma feature.

## Technical Context

**Language/Version**: Java 21

**Primary Dependencies**: Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation, Actuator), Flyway, driver PostgreSQL, Lombok. Para as etapas seguintes: Spring Security Crypto (BCrypt) para hash; Bucket4j para rate limiting no login.

**Storage**: PostgreSQL — **Supabase** (gerenciado, homolog/prod) e Postgres local via `infra/docker-compose.yml` (dev). Extensão `pgcrypto` já habilitada em `V1` (`gen_random_uuid()`).

**Testing**: JUnit 5 + Spring Boot Test + **Testcontainers (PostgreSQL)** — os testes rodam no Docker (Art. 1.6), com Flyway aplicando as migrações no container.

**Target Platform**: contêiner Linux (Docker) na Render; banco no Supabase.

**Project Type**: web service (API backend em `api/`) desacoplado do frontend Angular (`frontend/`).

**Performance Goals**: sem metas específicas (projeto acadêmico); login com rate limiting nas etapas seguintes.

**Constraints**: `ddl-auto=validate` (esquema é do Flyway); segredos só em variáveis de ambiente; nomes/artefatos em pt-BR.

**Scale/Scope**: baixa escala; 4 papéis fixos; um Gestor inicial. Esta etapa: 3 tabelas + entidades + repositórios + seed dos papéis.

## Constitution Check

*GATE: passar antes da Fase 0. Re-checar após a Fase 1.*

| Artigo | Exigência | Situação no plano |
|--------|-----------|-------------------|
| 1.1 | Backend OO em camadas (controller→service→repository→domínio) | ✅ entidades no domínio + repositórios; service/controller entram nas etapas de login |
| 1.2 / 7.2 | Postgres no Supabase com RLS | ✅ tabelas com RLS habilitado (baseline); escopo por usuário é AC-04 |
| 1.6 | Java só no Docker | ✅ build/testes no Docker (Testcontainers) |
| 2.3 | Papéis (4) N:N; só Gestor ativo no MVP | ✅ `usuario_papel` N:N + coluna `ativo` (Gestor=true) |
| 5 | TDD obrigatório | ✅ testes de repositório/modelo antes da implementação |
| 7.4 | Segredos só em env; sem credencial versionada | ✅ **nenhum usuário/senha semeado no repositório**; o Gestor inicial é criado por bootstrap via env na etapa de login |
| 8 | pt-BR | ✅ tabelas, colunas e código em pt-BR |

**Resultado do gate**: PASS — sem violações. (Ver `research.md` para as decisões que sustentam o gate, especialmente RLS e seed do Gestor.)

## Project Structure

### Documentation (this feature)

```text
specs/001-fundacao-acesso/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões
├── data-model.md        # Fase 1 — entidades, tabelas, seed, RLS
├── quickstart.md        # Fase 1 — como validar
├── contracts/           # Fase 1 — contrato da API de autenticação (etapa seguinte)
└── tasks.md             # Fase 2 — gerado pelo /speckit-tasks
```

### Source Code (repository root)

```text
api/
├── src/main/java/br/com/maissustentavel/api/
│   ├── acesso/                      # módulo de acesso (identidade)
│   │   ├── domain/
│   │   │   ├── Usuario.java         # @Entity (id UUID, nome, email único, senhaHash, criadoEm) — @ManyToMany papeis
│   │   │   └── Papel.java           # @Entity (id UUID, nome único, ativo)
│   │   └── repository/
│   │       ├── UsuarioRepository.java  # JpaRepository (findByEmail)
│   │       └── PapelRepository.java     # JpaRepository (findByNome)
│   │   # (service/ e web/ entram nas etapas de login — subtarefas 4 e 5)
│   └── config/SecurityConfig.java   # já existe
├── src/main/resources/db/migration/
│   ├── V1__init.sql                 # já existe (pgcrypto)
│   └── V2__modelo_acesso.sql        # tabelas usuario/papel/usuario_papel + seed papéis + RLS
└── src/test/java/br/com/maissustentavel/api/acesso/
    ├── PapelRepositoryTest.java     # 4 papéis; só Gestor ativo
    └── UsuarioPapelTest.java        # N:N (acúmulo), e-mail único

frontend/  # sem mudanças nesta etapa (tela de login é a subtarefa 5)
```

**Structure Decision**: web service (Opção 2) — módulo `acesso` no backend organizado por camadas (domínio + repositório agora; serviço/web nas etapas de login). Reaproveita o esqueleto Spring existente e o `SecurityConfig`.

## Complexity Tracking

> Sem violações da constituição — seção não aplicável.