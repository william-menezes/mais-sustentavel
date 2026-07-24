# Fluxo de Desenvolvimento — + Sustentável

Este documento descreve **como trabalhamos**. As regras inegociáveis estão em
[`.specify/memory/constitution.md`](../.specify/memory/constitution.md); aqui está o passo a passo prático.

---

## 1. Ciclo de uma história (Spec-Driven + TDD)

Para cada história do backlog (Jira), na ordem:

1. **Entender.** Ler a história em [`especificacao-detalhada-specs-sustentavel.md`](especificacao-detalhada-specs-sustentavel.md),
   o glossário (§1) e as regras transversais (§2). Só avançar quando o contexto estiver **100% claro** — na dúvida,
   `/speckit-clarify` ou marcar `[NEEDS CLARIFICATION]` (Art. 3.6).
2. **Specify.** `/speckit-specify` — gera o spec da feature (o "o quê/por quê", sem tecnologia). Cria a branch da feature.
3. **Clarify (opcional).** `/speckit-clarify` — perguntas dirigidas para remover ambiguidade antes do plano.
4. **Plan.** `/speckit-plan` — o "como" técnico (Spring/Angular/Supabase), respeitando a constituição.
5. **Tasks.** `/speckit-tasks` — tarefas em ordem de dependência. **As tarefas de teste vêm antes das de implementação** (TDD).
6. **Analyze.** `/speckit-analyze` — gate de consistência entre spec, plan e tasks (Art. 3.4), antes de implementar.
7. **Implement.** `/speckit-implement` — executa as tarefas, sempre **Red → Green → Refactor**.

Cada história rastreia: **história (Jira) ↔ feature spec ↔ `tasks.md` ↔ subtarefa (Jira)** (Art. 3.5).

---

## 2. TDD (Art. 5) — inegociável

- Nenhum código de produção antes do teste que o cobre.
- **Backend:** testes em `api/src/test`, executados **no Docker** (JUnit 5 + Testcontainers para o Postgres real).
- **Frontend:** testes `*.spec.ts`, executados com `ng test`.
- Critérios de aceite em **Gherkin** são a fonte dos testes de aceitação/integração.
- Nada é mesclado com teste falhando; o CI é o guardião.

---

## 3. Branches e promoção (Art. 6)

Três branches permanentes: **`develop`** → **`homolog`** → **`main`** (produção; padrão e protegida).

```
feature/NNN-slug ──PR──▶ develop ──PR──▶ homolog ──PR──▶ main
     (Spec Kit)         (validada)      (testes int.)   (homologado)
```

- Cada feature nasce de `develop`, na branch criada pelo Spec Kit.
- Promoção **sempre via Pull Request com CI verde**. Sem merge direto pulando etapas (salvo hotfix documentado).

---

## 4. Rodando o projeto

### Backend (Java vive só no Docker — Art. 1.6)

```bash
# Subir API + Postgres local (a partir da raiz):
docker compose -f infra/docker-compose.yml up --build

# Rodar os testes do backend no Docker (Testcontainers usa o socket do host):
docker run --rm \
  -v "$PWD/api":/app -v /var/run/docker.sock:/var/run/docker.sock \
  -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
```

> Health: `GET http://localhost:8080/actuator/health`.

### Frontend (Node no host)

```bash
cd frontend
npm ci
npm start          # ng serve → http://localhost:4200
npm test           # testes unitários
npm run build      # build de produção
```

---

## 5. Segurança (Art. 7) — em toda spec

Todo spec/plan considera, quando aplicável: **RLS no Supabase**, **rate limiting** (auth e endpoints públicos),
mensagens de erro genéricas (sem enumeração de usuários), **CORS** restrito, cabeçalhos de segurança, HTTPS e
validação de entrada. Segredos só em variáveis de ambiente.

---

## 6. Deploy

- **API:** Docker → **Render** (variáveis de ambiente apontando para o Supabase).
- **Frontend:** **Vercel** (build do Angular).
- **Banco:** **Supabase** (Postgres + RLS) em homologação/produção.