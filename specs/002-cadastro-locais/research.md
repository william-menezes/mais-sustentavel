# Pesquisa e Decisões — Cadastrar Local (CA-01)

Sem `[NEEDS CLARIFICATION]` pendentes (stack fixado pela constituição). Registro das decisões de "como".

## D1 — Representação do `tipo` do Local

- **Decisão**: `enum TipoLocal` no domínio (`CONDOMINIO, ESCOLA, EMPRESA, ESPACO_PUBLICO, OUTRO`), persistido como **texto** via `@Enumerated(EnumType.STRING)`, com uma **CHECK constraint** no banco listando exatamente esses valores. Os **rótulos em pt-BR** ("Condomínio", "Escola", "Empresa", "Espaço público", "Outro") vivem na **UI** (frontend), não no valor persistido.
- **Rationale**: a lista é fechada (FR-003); `enum` garante o domínio no código e a `CHECK` garante no banco (defesa em profundidade). Guardar o *nome* ASCII do enum evita problemas de acentuação/collation e mantém `ddl-auto=validate` satisfeito (coluna `text`). Separar rótulo de valor respeita o Art. 8 sem acoplar persistência a texto de tela.
- **Alternativas**: `EnumType.ORDINAL` — rejeitado (frágil a reordenação); tipo `text` livre com validação só na aplicação — rejeitado (perde integridade no banco); tipo enum nativo do Postgres — rejeitado (migrações de enum no PG são chatas; `CHECK` é mais simples e portável).

## D2 — Soft delete (arquivamento)

- **Decisão**: coluna `arquivado boolean not null default false`. **Arquivar** faz `arquivado = true`; **reativar** faz `arquivado = false`. Listagem padrão filtra `arquivado = false`; visão de arquivados filtra `arquivado = true`. **Nunca** há `DELETE` físico.
- **Rationale**: cumpre RN-G-06 / Art. 2.6 — o registro e o histórico/valor social (features futuras) são preservados. Um booleano é suficiente para o MVP e trivial de testar/consultar.
- **Alternativas**: coluna `arquivado_em timestamptz` (nulo = ativo) — mais informativa, mas nada nesta feature usa a data do arquivamento; adiável sem custo (YAGNI). `status` enum (ATIVO/ARQUIVADO) — over-engineering para dois estados.

## D3 — Reativar (desarquivar)

- **Decisão**: **suportado** nesta feature (endpoint `POST /api/locais/{id}/reativar` + ação na UI).
- **Rationale**: a spec assume o suporte (Assumptions). É o par natural do arquivar, custo marginal (inverte o mesmo flag) e evita que um arquivamento acidental exija intervenção no banco. Melhora a demonstração da sprint.
- **Alternativas**: só arquivar (a história cita apenas "arquivar") — rejeitado: deixaria o estado irreversível pela interface, o que é pior de usar e de demonstrar. Registrado aqui para rastreabilidade caso a revisão prefira remover.

## D4 — Rate limiting: não se aplica aqui (Art. 7.3)

- **Decisão**: **não** adicionar rate limiting aos endpoints `/api/locais`.
- **Rationale**: o Art. 7.3 exige rate limiting em endpoints **públicos e de autenticação** (mitigar força bruta/abuso anônimo). `/api/locais` é interno, exige **sessão autenticada** de Gestor e não é superfície de enumeração de credenciais. Aplicar limitador aqui não agrega segurança e adiciona complexidade sem valor. O limitador do login (AC-01) permanece onde importa.
- **Alternativas**: limitar mesmo assim — rejeitado (custo sem ganho). Reavaliar quando houver endpoints de escrita expostos a papéis menos confiáveis (backlog).

## D5 — Tratamento de erros sem vazamento (Art. 7.6 / FR-012)

- **Decisão**: um `@RestControllerAdvice` traduz exceções em respostas limpas em pt-BR: **400** para falha de validação (Bean Validation → mapa `campo → mensagem`), **404** para `LocalNaoEncontradoException`, **401** já é tratado pelo Spring Security. Sem stacktrace, sem SQL, sem detalhes internos no corpo.
- **Rationale**: mensagens genéricas e estáveis (FR-012); a validação de campos precisa ser específica o bastante para orientar o Gestor (qual campo faltou) sem revelar internals. Centralizar no advice evita repetição nos controllers.
- **Alternativas**: tratar erro em cada controller — rejeitado (espalha a regra). Deixar o Spring devolver o erro padrão — rejeitado (pode vazar detalhes e não fica em pt-BR consistente).

## D6 — Autorização reaproveitando a AC-01

- **Decisão**: a **autorização** não muda — a allowlist pública cobre só `/actuator/health|info` e `/api/auth/login|logout`, então `/api/locais/**` cai em `anyRequest().authenticated()`, autorizado pela sessão (cookie `JSESSIONID`, que já é **`HttpOnly`** por padrão do servlet). **Porém**, por esta feature introduzir os primeiros endpoints de **escrita** autenticados, o `SecurityConfig` **passa a habilitar CSRF e CORS** (ver **D8**/**D9**).
- **Rationale**: reuso direto da fundação; no MVP só o Gestor autentica, então "autenticado" ≡ "Gestor" (RN-G-03). Autorização por papel/escopo é AC-04.
- **Alternativas**: `@PreAuthorize("hasRole('Gestor')")` agora — adiável para AC-04 (ainda não há RBAC na aplicação).

## D8 — CSRF: manter sessão e endurecer (decisão do usuário)

- **Decisão**: **manter a sessão atual** (sem migrar para JWT) e **habilitar a proteção CSRF** no padrão SPA: `CookieCsrfTokenRepository.withHttpOnlyFalse()` emite um cookie **legível** `XSRF-TOKEN`; o Angular `HttpClient` reenvia esse valor no header `X-XSRF-TOKEN` automaticamente; o servidor compara header × cookie (**double-submit**). Requisições de escrita (`POST`/`PUT`) sem token válido → **403**. Usa-se o handler SPA (`XorCsrfTokenRequestAttributeHandler`) + um filtro que força a emissão do cookie (para o carregamento diferido do Spring Security 6).
- **Rationale**: `HttpOnly` protege o **token de sessão** contra roubo por XSS, mas **não** protege contra CSRF (o cookie é enviado automaticamente). O double-submit fecha essa lacuna e é seguro mesmo cross-site, pois um site atacante não consegue **ler** o `XSRF-TOKEN` (mesma-origem) para forjar o header. É o par correto do cookie de sessão em SPA. Menos retrabalho que migrar o mecanismo de auth (a sessão já é "token em cookie HttpOnly").
- **Priming do token**: como o SPA é servido pelo dev-server (não pelo Spring), o cookie `XSRF-TOKEN` precisa ser semeado antes do 1º `POST` (inclusive o login). Faz-se um `GET` inicial à API no `bootstrap` do app (ou um endpoint leve dedicado) que dispara a emissão do cookie.
- **Impacto nos testes da AC-01**: `AutenticacaoIntegrationTest`/`SecurityConfigTest` passam a exigir `.with(csrf())` nos `POST` do MockMvc; ajuste incluído nas tasks.
- **Alternativas**: JWT stateless em cookie HttpOnly — rejeitado agora (mais retrabalho, mexe na AC-01, mesma exigência de CSRF); token no header `Authorization` — rejeitado (imune a CSRF, mas exposto a XSS e exige guardar o token no cliente).

## D9 — CORS restrito (Art. 7.5)

- **Decisão**: `CorsConfigurationSource` dedicado, com **origens permitidas via variável de ambiente** (dev: `http://localhost:4200`; prod: domínio do frontend na Vercel), `allowCredentials(true)`, métodos `GET/POST/PUT/OPTIONS` e headers incluindo `X-XSRF-TOKEN` e `Content-Type`. `SecurityConfig` habilita `.cors()`.
- **Rationale**: com credenciais (cookie) não se pode usar `*`; origens explícitas são exigidas pelo Art. 7.5 e pelo próprio contrato de cookies com credenciais. Em dev o proxy do Angular já mantém same-origin; o CORS cobre o cenário cross-site de produção.
- **Alternativas**: liberar tudo (`*`) — rejeitado (incompatível com credenciais e viola 7.5); não configurar — rejeitado (quebra o frontend cross-site em produção).

## D10 — Tratamento de 401 no frontend (item U1 do analyze)

- **Decisão**: um `HttpInterceptor` global captura respostas **401** e redireciona para `/login`. Reativo (a chamada acontece e é barrada pelo servidor, que continua sendo a guarda real).
- **Rationale**: centraliza o tratamento de sessão expirada sem endpoint novo; idiomático no Angular. Guard **preventivo** (`canActivate`) fica para depois e exigirá uma fonte de verdade no servidor (ex.: `GET /api/auth/me` 200/401), já que o token em cookie `HttpOnly` não é legível pelo JS.
- **Alternativas**: tratar 401 em cada chamada — rejeitado (repetitivo); guard preventivo agora — adiado (depende de `/api/auth/me`, aproxima-se da AC-04).

## D11 — Ressalva de produção cross-site (dívida registrada)

- **Contexto**: em produção o frontend (Vercel) e a API (Render) são **sites diferentes**. Para o cookie de sessão viajar cross-site ele precisa de `SameSite=None; Secure`, e o XSRF do Angular tem particularidades para URLs absolutas (cross-origin). O double-submit (D8) protege o CSRF nesse cenário, mas a configuração de `SameSite`/CORS credenciado precisa ser validada no deploy.
- **Decisão**: no MVP (dev via proxy same-origin) tudo funciona; a validação do cross-site em produção fica **registrada como item de deploy** (não bloqueia a CA-01). Documentar no `docs/deploy.md` ao publicar o frontend.

## D7 — Estratégia de teste (TDD)

- **Decisão**: mesma stack da AC-01. `LocalRepositoryTest` (persistência + `findByArquivado*`) e `LocalServiceTest`/`LocalControllerTest` com Testcontainers (Postgres real) rodando no Docker; Flyway aplica `V3` no container. Frontend: specs de `local.service`, `local-list` e `local-form` no runner Vitest, com `HttpTestingController` para o serviço.
- **Rationale**: valida o mapeamento JPA e a `CHECK` do tipo contra o esquema real do Flyway (`ddl-auto=validate`); fiel ao ambiente e coerente com os testes já existentes.
- **Alternativas**: H2 em memória — rejeitado (dialeto divergente; não valida `CHECK`/RLS/pgcrypto).
