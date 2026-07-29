# Quickstart — Validar a feature Cadastrar Local (CA-01)

Guia de validação ponta a ponta. Detalhes de entidade/rotas: ver [data-model.md](./data-model.md) e [contracts/locais.md](./contracts/locais.md).

## Pré-condições

- Docker Desktop em execução (Java vive só no Docker — Art. 1.6).
- Node no host (frontend). Gestor semeado no dev (`SEED_GESTOR_EMAIL`/`SEED_GESTOR_SENHA` do `infra/docker-compose.yml`).

## 1. Testes (TDD — devem passar antes de dar por pronto)

Backend (no Docker, Testcontainers sobe um Postgres real e aplica `V1..V3`):
```bash
docker run --rm \
  -v "$PWD/api":/app -v /var/run/docker.sock:/var/run/docker.sock \
  -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
```
Espera-se verde em `LocalRepositoryTest`, `LocalServiceTest`, `LocalControllerTest` (além dos testes da AC-01).

Frontend:
```bash
cd frontend && npm test
```
Espera-se verde em `local.service.spec.ts`, `local-list.spec.ts`, `local-form.spec.ts`.

## 2. Subir o ambiente

```bash
# API + Postgres (a partir da raiz)
docker compose -f infra/docker-compose.yml up --build
# Frontend
cd frontend && npm start   # http://localhost:4200 (proxy /api → :8080)
```

## 3. Roteiro de aceitação (mapeado aos cenários Gherkin)

Autentique-se antes (o cookie de sessão autoriza `/api/locais`). Via UI: `http://localhost:4200/login` → depois `/locais`.

**US1 — Cadastrar (P1)**
1. Em `/locais`, abrir "Novo local", informar nome, tipo e endereço → salvar.
   - ✅ o local aparece imediatamente na listagem de **ativos** (SC-001).
2. Tentar salvar sem nome / sem endereço / sem tipo.
   - ✅ bloqueado com mensagem de validação por campo (SC-002).

**US2 — Arquivar (P2)**
3. Arquivar um local ativo.
   - ✅ some da lista de ativos (SC-003).
4. Alternar para a visão "Arquivados".
   - ✅ o local aparece lá, com dados preservados (SC-004).
5. Arquivar novamente o mesmo local (via API): `POST /api/locais/{id}/arquivar`.
   - ✅ 200, permanece arquivado (idempotente).

**US3 — Editar/Reativar (P3)**
6. Editar nome/tipo/endereço de um local → salvar.
   - ✅ alterações refletidas na listagem.
7. Reativar um local arquivado.
   - ✅ volta para a lista de ativos.

**Segurança**
8. Sem sessão, chamar `GET /api/locais` (ex.: aba anônima / curl sem cookie).
   - ✅ **401** (SC-005), sem vazar detalhes internos.
9. Autenticado, enviar um `POST /api/locais` **sem** o header `X-XSRF-TOKEN`.
   - ✅ **403** (SC-006 / FR-014). Com o token, a mesma escrita passa.

## 4. Sondagem rápida por API (opcional, autenticado)

Com CSRF ativo, as escritas exigem `X-XSRF-TOKEN`. O fluxo por `curl`: (1) semear o cookie `XSRF-TOKEN`, (2) reusá-lo no header.

```bash
# 1) primar o cookie XSRF-TOKEN (GET qualquer que dispare a emissão)
curl -s -c cookies.txt http://localhost:8080/api/auth/csrf > /dev/null
XSRF=$(grep XSRF-TOKEN cookies.txt | awk '{print $7}')

# 2) login (POST precisa do token e mantém a sessão em cookies.txt)
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H "X-XSRF-TOKEN: $XSRF" -H 'Content-Type: application/json' \
  -d '{"email":"gestor@maissustentavel.local","senha":"Gestor@123"}'
XSRF=$(grep XSRF-TOKEN cookies.txt | awk '{print $7}')   # atualiza após o login

# 3) criar um local (escrita → exige o token)
curl -s -b cookies.txt -X POST http://localhost:8080/api/locais \
  -H "X-XSRF-TOKEN: $XSRF" -H 'Content-Type: application/json' \
  -d '{"nome":"Escola Municipal","tipo":"ESCOLA","endereco":"Av. Central, 200"}'

# 4) leituras (GET não exige token)
curl -s -b cookies.txt http://localhost:8080/api/locais            # ativos
curl -s -b cookies.txt 'http://localhost:8080/api/locais?arquivados=true'  # arquivados
```

> O endpoint exato de priming (`/api/auth/csrf` ou outro `GET`) é definido na implementação (T043/T047). No navegador, o Angular faz isso automaticamente.

## Critério de "pronto"

- Todos os testes (back + front) verdes no CI.
- Os 8 passos acima conferem com os cenários da spec.
- Nenhum `DELETE` físico de local em nenhum caminho (só `arquivado`).
