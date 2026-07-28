# Quickstart — Validação da Fundação de Acesso (AC-01, etapa de modelagem)

Como provar que a modelagem funciona ponta a ponta. Detalhes em [data-model.md](./data-model.md).

## Pré-requisitos
- Docker Desktop rodando (Java vive só no Docker — Art. 1.6).
- Migração `V2__modelo_acesso.sql` e entidades JPA implementadas (ver `tasks.md`).

## 1. Testes (TDD) — no Docker
Rodam JUnit + Testcontainers (Postgres real; Flyway aplica `V1`+`V2`):

```bash
docker run --rm \
  -v "$PWD/api":/app -v /var/run/docker.sock:/var/run/docker.sock \
  -v mais-m2:/root/.m2 -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
```

**Esperado**: verde. Cobrem:
- `PapelRepositoryTest` — existem 4 papéis (Gestor, Responsável, Coletor, Doador); só Gestor `ativo=true`.
- `UsuarioPapelTest` — um usuário acumula ≥2 papéis (N:N); e-mail duplicado é rejeitado.

> No CI (GitHub Actions) o mesmo roda via `mvn verify` no runner Ubuntu.

## 2. Subir a API + Postgres local e inspecionar o banco

```bash
docker compose -f infra/docker-compose.yml up --build
```

A API sobe com `ddl-auto=validate` (o mapeamento JPA bate com o esquema do Flyway). Depois, no Postgres local:

```sql
-- 4 papéis, só Gestor ativo:
select nome, ativo from papel order by nome;
-- Espera: Coletor|f, Doador|f, Gestor|t, Responsável|f

-- RLS habilitado nas 3 tabelas:
select relname, relrowsecurity from pg_class
 where relname in ('usuario','papel','usuario_papel');
-- Espera: relrowsecurity = t nas três
```

## 3. Critérios de aceite cobertos
- **SC-001** (4 papéis, só Gestor ativo) → passo 1 e 2.
- **SC-004** (usuário acumula papéis) → `UsuarioPapelTest`.
- Baseline de segurança (RLS habilitado) → consulta do passo 2.

> Fora desta etapa: login, seed do Gestor (bootstrap via env) e a tela — validados nas subtarefas 4 e 5.