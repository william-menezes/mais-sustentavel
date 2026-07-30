# Contrato — Coletas (OP-03)

Recurso **Coleta**, no contexto de um **Ponto**. Todos os endpoints exigem **sessão autenticada** (cookie `JSESSIONID` `HttpOnly`); sem sessão → **401**. A escrita (`POST`) exige o header **`X-XSRF-TOKEN`** (CSRF); sem token → **403**. JSON; corpo/mensagens em pt-BR (FR-012).

## POST `/api/pontos/{pontoId}/coletas`
Registra uma coleta (medição real) no ponto. "Quem registrou" é o usuário autenticado.

- **Request** `application/json`: `{ "litrosReais": number (> 0), "data": "YYYY-MM-DD" (não futura) }`.
- **201 Created**: `Location: /api/coletas/{id}` (informativo) + corpo `ColetaResponse`.
- **400 Bad Request**: `litrosReais` ≤ 0/ausente ou `data` ausente/futura/inválida → `{ "erro": "Dados inválidos", "campos": { ... } }`.
- **404 Not Found**: Ponto inexistente → `{ "erro": "Ponto não encontrado" }`.
- **409 Conflict**: Ponto arquivado → `{ "erro": "Ponto arquivado não recebe novas coletas" }`.
- **401 / 403**: sem sessão / sem token CSRF.

## GET `/api/pontos/{pontoId}/coletas`
Lista as coletas do ponto (mais recentes primeiro) e o total de litros.

- **200 OK**: `ColetasDoPontoResponse`.

## ColetaResponse
```json
{
  "id": "uuid",
  "pontoId": "uuid",
  "litrosReais": 12.5,
  "data": "2026-07-20",
  "coletorNome": "Gestor",
  "criadoEm": "2026-07-30T12:00:00Z"
}
```
`coletorNome` pode ser `null` quando não há coletor associado.

## ColetasDoPontoResponse
```json
{
  "totalLitros": 37.5,
  "coletas": [ /* ColetaResponse[] */ ]
}
```
`totalLitros` é a soma dos `litrosReais` (0 quando não há coletas).

## Segurança (resumo)
- Autenticação obrigatória; **CSRF** na escrita; **CORS** restrito (reaproveitados da CA-01/AC-01).
- **RLS** habilitada na tabela `coleta`.
- Validação server-side (`litrosReais > 0`, `data` não futura, ponto existente); sem SQL dinâmico.
- Coleta é **imutável**: não há `PUT`/`DELETE`.
- Valor social em R$ e agregação por local/período → **IS-01** (fora deste contrato).
