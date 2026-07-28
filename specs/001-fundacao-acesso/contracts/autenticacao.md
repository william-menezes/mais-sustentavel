# Contrato — Autenticação (Fundação de Acesso)

> A **etapa de modelagem** (subtarefa 3) **não expõe endpoint**. Este contrato define a interface
> de autenticação da feature, a ser implementada nas subtarefas 4 (auth) e 5 (tela). Registrado aqui
> para coerência do plano.

## POST `/api/auth/login`
Autentica por e-mail e senha; cria sessão carregando o(s) papel(is).

- **Request** `application/json`: `{ "email": "string", "senha": "string" }`
- **200 OK**: sessão criada; corpo com dados mínimos do usuário e papéis ativos (ex.: `{ "nome": "...", "papeis": ["Gestor"] }`).
- **401 Unauthorized**: credenciais inválidas **ou** conta inexistente → **mesma** mensagem genérica (FR-007, anti-enumeração). Corpo: `{ "erro": "Credenciais inválidas" }`.
- **429 Too Many Requests**: acima do limite de tentativas (rate limiting, FR-010).

## POST `/api/auth/logout`
Encerra a sessão.

- **204 No Content**: sessão encerrada.

## Regras transversais
- Mensagens em pt-BR (FR-012).
- Senha nunca retornada nem logada; comparação via hash BCrypt (FR-005).
- Endpoints públicos de auth sujeitos a rate limiting (FR-010).

> Endpoints já liberados hoje no `SecurityConfig`: `/actuator/health`. O `/api/auth/**` será liberado (público) quando implementado; o restante segue exigindo autenticação.