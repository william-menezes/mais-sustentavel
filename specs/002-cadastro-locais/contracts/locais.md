# Contrato — Cadastro de Local (`/api/locais`)

Recurso **Local**. Todos os endpoints exigem **sessão autenticada** (cookie `JSESSIONID`, `HttpOnly`, criado no `/api/auth/login`). Sem sessão → **401** (tratado pelo Spring Security). As operações de **escrita** (`POST`/`PUT`) exigem ainda o header **`X-XSRF-TOKEN`** (proteção CSRF double-submit); sem token válido → **403**. Corpo e mensagens em pt-BR (FR-013). `Content-Type: application/json`.

## Representação

`LocalResponse`:
```json
{
  "id": "uuid",
  "nome": "Condomínio Jardim das Acácias",
  "endereco": "Rua das Flores, 100 - Centro",
  "tipo": "CONDOMINIO",
  "arquivado": false,
  "criadoEm": "2026-07-29T12:00:00Z"
}
```
> `tipo` é o **código** (enum). O rótulo pt-BR ("Condomínio") é derivado no frontend.

`LocalRequest` (criação/edição):
```json
{ "nome": "string (obrigatório)", "endereco": "string (obrigatório)", "tipo": "CONDOMINIO|ESCOLA|EMPRESA|ESPACO_PUBLICO|OUTRO (obrigatório)" }
```

## Endpoints

### POST `/api/locais` — cadastrar
- **Request**: `LocalRequest`.
- **201 Created**: `LocalResponse` do local criado (`arquivado=false`). Header `Location: /api/locais/{id}`.
- **400 Bad Request**: validação (campo vazio ou `tipo` fora da lista) → corpo de erro de validação.
- **401**: sem sessão.

### GET `/api/locais` — listar
- **Query**: `arquivados` (boolean, default `false`). `false` → apenas ativos; `true` → apenas arquivados.
- **200 OK**: `LocalResponse[]` (pode ser vazio).
- **401**: sem sessão.

### GET `/api/locais/{id}` — detalhar
- **200 OK**: `LocalResponse`.
- **404 Not Found**: id inexistente → erro genérico.

### PUT `/api/locais/{id}` — editar
- **Request**: `LocalRequest` (mesmas validações do cadastro). Não altera `arquivado`.
- **200 OK**: `LocalResponse` atualizado.
- **400**: validação. **404**: id inexistente.

### POST `/api/locais/{id}/arquivar` — arquivar (soft delete)
- **200 OK**: `LocalResponse` com `arquivado=true`. **Idempotente** (já arquivado → 200, permanece arquivado).
- **404**: id inexistente.

### POST `/api/locais/{id}/reativar` — reativar
- **200 OK**: `LocalResponse` com `arquivado=false`. **Idempotente** (já ativo → 200).
- **404**: id inexistente.

## Formatos de erro

Validação (**400**) — mapa campo → mensagem:
```json
{ "erro": "Dados inválidos", "campos": { "nome": "não pode ser vazio", "tipo": "valor inválido" } }
```

Não encontrado (**404**) / genérico:
```json
{ "erro": "Local não encontrado" }
```

> Nenhum corpo de erro expõe stacktrace, SQL ou detalhes internos (FR-012 / Art. 7.6).

## Segurança (resumo)

- Autenticação obrigatória em todos os endpoints; **sem** allowlist para `/api/locais` no `SecurityConfig` (cai em `anyRequest().authenticated()`). Sessão em cookie **`HttpOnly`**.
- **CSRF (FR-014)**: escritas (`POST`/`PUT`) exigem `X-XSRF-TOKEN` (double-submit; cookie `XSRF-TOKEN` emitido pela API e reenviado automaticamente pelo Angular). Sem token → **403**. Aplica-se também ao `POST /api/auth/login`.
- **CORS (FR-015)**: apenas origens conhecidas (via env), com credenciais habilitadas (D9).
- RLS habilitada na tabela `local` (baseline anti-exposição via PostgREST).
- Validação server-side em toda entrada; sem SQL dinâmico (Spring Data / JPA).
- **Rate limiting não se aplica** (endpoint interno autenticado — ver `research.md` D4).
- Autorização por papel/escopo (só Gestor, filtro por local) → **AC-04**.
