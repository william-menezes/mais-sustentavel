# + Sustentável

Plataforma web de **logística reversa de óleo de cozinha usado**. Cada litro real coletado
vira **R$ 1,00 para ações sociais** — "cada litro soma".

> Trabalho da disciplina **FACOM32403 — Processo de Desenvolvimento de Software** (UFU, 2026/1).
> Integrante: **William Menezes Damascena** (12521BSI233).

---

## Stack

| Camada | Tecnologia | Deploy |
|--------|------------|--------|
| Backend | Java 21 · Spring Boot 4 (arquitetura em camadas) | Docker → **Render** |
| Frontend | Angular 22 · PrimeNG | **Vercel** |
| Banco | PostgreSQL (com RLS) | **Supabase** |
| Processo | Spec-Driven Development (GitHub Spec Kit) + **TDD** | — |

> **Java vive apenas no Docker** — não é preciso JDK no host (ver `constitution.md`, Art. 1.6).

## Estrutura do monorepo

```
api/         API Spring Boot (Java só no Docker) + Dockerfile multi-stage
frontend/    SPA Angular + PrimeNG (design tokens de docs/design.md)
infra/       docker-compose (Postgres + API) para desenvolvimento local
docs/        design system, histórias detalhadas, backlog e fluxo de trabalho
.specify/    Spec Kit — constituição canônica e templates
.claude/     skills /speckit-* do Spec Kit
```

## Começando

**Pré-requisitos:** Docker Desktop e Node 20+ (para o frontend). JDK não é necessário no host.

### Backend + banco (Docker)

```bash
docker compose -f infra/docker-compose.yml up --build
# Health: http://localhost:8080/actuator/health
```

### Frontend

```bash
cd frontend
npm ci
npm start          # http://localhost:4200
npm test -- --watch=false
```

## Processo e documentação

- **Constituição (regras inegociáveis):** [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- **Fluxo (branches, TDD, Spec Kit):** [`docs/workflow.md`](docs/workflow.md)
- **Design system:** [`docs/design.md`](docs/design.md)
- **Histórias / backlog:** [`docs/especificacao-detalhada-specs-sustentavel.md`](docs/especificacao-detalhada-specs-sustentavel.md) · Jira

## Branches

```
feature/NNN-slug ──▶ develop ──▶ homolog ──▶ main (produção)
```

Promoção sempre via Pull Request com CI verde. Detalhes em [`docs/workflow.md`](docs/workflow.md).