# Quickstart — Validar a CA-02 (Cadastrar Ponto de Coleta)

Pré: API no Docker (`:8080`) + `ng serve` (`:4200`), Gestor semeado. Login: `gestor@maissustentavel.local` / `Gestor@123`.

## 1. Testes automatizados
```bash
# Backend (Docker + Testcontainers):
docker run --rm -v "$PWD/api":/app -v /var/run/docker.sock:/var/run/docker.sock \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal -w /app \
  maven:3.9-eclipse-temurin-21 mvn -B clean verify

# Frontend:
cd frontend && npm test -- --watch=false
```

## 2. Pela interface (`http://localhost:4200`)
1. Entrar como Gestor → **Locais**.
2. Num local **ativo**, abrir **Pontos**.
3. **Novo ponto** → o ponto aparece na lista com seu **QR**.
   - ✅ US1: ponto criado com QR único.
4. Criar mais pontos no mesmo local → cada um com **QR distinto** (US1 cenário 2).
5. Clicar no QR de um ponto → **exibe a imagem**; **baixar** a imagem.
   - ✅ US2: QR recuperável (exibir/baixar), estável.
6. **Arquivar** um ponto → some da lista ativa; alternar para **Arquivados** → aparece lá.
7. **Reativar** → volta aos ativos.
   - ✅ US3: soft delete + reativar.

## 3. Regras/segurança
- Tentar cadastrar ponto em um **local arquivado** → bloqueado (**409**).
- `GET /api/locais/{id}/pontos` sem sessão → **401**.
- `POST` sem `X-XSRF-TOKEN` → **403**.
- Ponto inexistente em `qr`/`arquivar`/`reativar` → **404** (mensagem genérica).

## 4. Sondagem por API (opcional, autenticado + CSRF)
```bash
# (após primar XSRF-TOKEN e logar — ver quickstart da CA-01)
# criar ponto num local ativo:
curl -s -b cookies.txt -X POST http://localhost:8080/api/locais/$LOCAL_ID/pontos \
  -H "X-XSRF-TOKEN: $XSRF" -H 'Content-Type: application/json' -d '{}'
# baixar o QR (PNG):
curl -s -b cookies.txt http://localhost:8080/api/pontos/$PONTO_ID/qr -o qr.png
# listar pontos do local:
curl -s -b cookies.txt http://localhost:8080/api/locais/$LOCAL_ID/pontos
```

## Rastreabilidade
História CA-02 ↔ `spec.md` ↔ `tasks.md` ↔ subtarefas Jira (modelar Ponto; gerar QR; tela com exibição/download).
