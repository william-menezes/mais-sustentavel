# Contrato — Impacto / Valor social (IS-01)

Recurso **Impacto** (agregados de valor social), derivado das `Coleta`. Todos os endpoints são **somente leitura** e exigem **sessão autenticada** (cookie `JSESSIONID` `HttpOnly`); sem sessão → **401**. Sendo `GET`, **não** exigem CSRF. JSON; corpo/mensagens em pt-BR (FR-012).

**Regra de conversão**: `valorSocial = litrosReais × R$ 1,00` (RN-G-02). `litrosReais` com 3 casas; `valorSocial` com 2 casas.

**Parâmetros de período** (comuns aos três endpoints, opcionais): `de` e `ate` (`yyyy-MM-dd`). Filtram por `Coleta.data` de forma **inclusiva**. Se ambos presentes e `de > ate` → **400**. Coletas de locais/pontos **arquivados contam** (RN-G-06).

---

## GET `/api/impacto/valor-social`
Total geral de litros reais e valor social, no período.

- **Query (opcional)**: `de`, `ate`.
- **200 OK**: `ValorSocialResponse`.
- **400 Bad Request**: `de > ate` → `{ "erro": "Período inválido" }`; data em formato inválido → `{ "erro": "Dados inválidos" }`.
- **401**: sem sessão.

### ValorSocialResponse
```json
{ "litrosReais": 18.000, "valorSocial": 18.00 }
```
Sem coletas (ou período vazio): `{ "litrosReais": 0, "valorSocial": 0.00 }` (200, não erro).

---

## GET `/api/impacto/valor-social/por-local`
Valor social agregado por local, no período. Ordenado por nome do local.

- **Query (opcional)**: `de`, `ate`.
- **200 OK**: `ValorSocialLocalResponse[]`.
- **400 / 401**: idem acima.

### ValorSocialLocalResponse
```json
[
  { "localId": "uuid", "localNome": "Escola Municipal", "litrosReais": 12.500, "valorSocial": 12.50 },
  { "localId": "uuid", "localNome": "Condomínio Verde", "litrosReais": 5.500, "valorSocial": 5.50 }
]
```
Locais sem coletas no período não aparecem. Lista vazia `[]` quando não há coletas.

---

## GET `/api/impacto/valor-social/mensal`
Série mensal (ano-mês) do valor social, no período. Ordenada cronologicamente.

- **Query (opcional)**: `de`, `ate`.
- **200 OK**: `ValorSocialMensalResponse[]`.
- **400 / 401**: idem acima.

### ValorSocialMensalResponse
```json
[
  { "competencia": "2026-06", "litrosReais": 6.000, "valorSocial": 6.00 },
  { "competencia": "2026-07", "litrosReais": 12.000, "valorSocial": 12.00 }
]
```
Meses sem coletas não aparecem. Lista vazia `[]` quando não há coletas.

---

## Reconciliação (garantia)
Para o mesmo período: `Σ valorSocial(por-local) == Σ valorSocial(mensal) == valorSocial(total)` (SC-002).

## Segurança (resumo)
- Autenticação obrigatória (401 sem sessão); **sem CSRF** (somente `GET`).
- **CORS** restrito reaproveitado (CA-01/AC-01).
- **RLS** já habilitada na tabela de origem `coleta`; nenhuma tabela nova.
- Validação server-side dos parâmetros de período; consultas parametrizadas (sem SQL dinâmico).
- Sem `POST`/`PUT`/`DELETE`: recurso puramente derivado/read-only.
