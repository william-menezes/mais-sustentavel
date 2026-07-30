# Quickstart — Validar a OP-03 (Registrar Coleta)

Pré: API no Docker (`:8080`) + `ng serve` (`:4200`), Gestor semeado, um Local ativo com ao menos um Ponto (CA-01/CA-02).

## 1. Testes automatizados
```bash
docker run --rm -v "$PWD/api":/app -v /var/run/docker.sock:/var/run/docker.sock \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal -w /app \
  maven:3.9-eclipse-temurin-21 mvn -B clean verify
cd frontend && npm test -- --watch=false
```

## 2. Pela interface (`http://localhost:4200`)
1. Entrar como Gestor → **Locais** → **Pontos** de um local → **Coletas** de um ponto.
2. **Registrar coleta**: informar litros (> 0) e data (não futura) → salva.
   - ✅ US1: coleta associada ao ponto; entra no **total de litros**.
3. Registrar mais coletas → o **total** cresce pela soma.
   - ✅ US2: lista de coletas (data, litros, quem registrou) + total.
4. Tentar litros ≤ 0 ou data futura → recusado (validação).

## 3. Regras/segurança
- `GET /api/pontos/{id}/coletas` sem sessão → **401**.
- `POST` sem `X-XSRF-TOKEN` → **403**.
- Registrar em ponto inexistente → **404**.
- Litros ≤ 0 / data futura → **400**.

## 4. Sondagem por API (autenticado + CSRF)
```bash
# (após primar XSRF-TOKEN e logar — ver quickstart da CA-01)
curl -s -b cookies.txt -X POST http://localhost:8080/api/pontos/$PONTO_ID/coletas \
  -H "X-XSRF-TOKEN: $XSRF" -H 'Content-Type: application/json' \
  -d '{"litrosReais": 12.5, "data": "2026-07-20"}'
# total + lista:
curl -s -b cookies.txt http://localhost:8080/api/pontos/$PONTO_ID/coletas
```

## Rastreabilidade
História OP-03 ↔ `spec.md` ↔ `tasks.md` ↔ subtarefas Jira (modelar Coleta; serviço de registro; tela de registro). Alimenta a IS-01 (valor social).
