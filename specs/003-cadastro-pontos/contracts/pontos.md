# Contrato — Pontos de Coleta (CA-02)

Recurso **Ponto**, sempre no contexto de um **Local**. Todos os endpoints exigem **sessão autenticada** (Gestor; cookie `JSESSIONID` `HttpOnly`). Sem sessão → **401**. As escritas (`POST`) exigem o header **`X-XSRF-TOKEN`** (CSRF double-submit); sem token → **403**. Corpo/mensagens em pt-BR (FR-014). JSON, salvo o QR (imagem).

## POST `/api/locais/{localId}/pontos`
Cria um Ponto no Local indicado e gera seu QR único.

- **Request**: corpo vazio (`{}`) — o ponto é determinado pelo local; o QR é gerado pelo servidor.
- **201 Created**: `Location: /api/pontos/{id}` + corpo `PontoResponse`.
- **404 Not Found**: Local inexistente → `{ "erro": "Local não encontrado" }`.
- **409 Conflict**: Local arquivado → `{ "erro": "Local arquivado não aceita novos pontos" }`.
- **401 / 403**: sem sessão / sem token CSRF.

## GET `/api/locais/{localId}/pontos?arquivados={false|true}`
Lista os Pontos do Local. `arquivados` default `false` (só ativos).

- **200 OK**: `PontoResponse[]`.

## GET `/api/pontos/{id}/qr`
Imagem do QR Code do ponto (para exibição e download). Estável (mesmo QR a cada chamada).

- **200 OK**: `Content-Type: image/png` — bytes da imagem do QR (conteúdo = URL do ponto).
- **404 Not Found**: ponto inexistente.

## POST `/api/pontos/{id}/arquivar`
Arquiva (soft delete). Idempotente.

- **200 OK**: `PontoResponse` com `arquivado: true`.
- **404 Not Found**: ponto inexistente.

## POST `/api/pontos/{id}/reativar`
Reativa um ponto arquivado. Idempotente.

- **200 OK**: `PontoResponse` com `arquivado: false`.
- **404 Not Found**: ponto inexistente.

## PontoResponse
```json
{
  "id": "uuid",
  "localId": "uuid",
  "qrConteudo": "https://<base>/p/<id>",
  "qrImagemUrl": "/api/pontos/<id>/qr",
  "arquivado": false,
  "criadoEm": "2026-07-29T12:00:00Z"
}
```

## Segurança (resumo)
- Autenticação obrigatória em todos os endpoints (inclui o `GET .../qr`).
- **CSRF** nas escritas (`X-XSRF-TOKEN`); **CORS** restrito por env — reaproveitados da CA-01.
- **RLS** habilitada na tabela `ponto` (baseline anti-exposição via PostgREST).
- Validação server-side (Local ativo, existência); sem SQL dinâmico (Spring Data/JPA).
- Autorização por papel/escopo (só Gestor, filtro por local) → **AC-04**.
