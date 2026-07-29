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

## D6 — Segurança de acesso reaproveitando a AC-01

- **Decisão**: **não alterar** o `SecurityConfig`. Como a allowlist pública cobre apenas `/actuator/health|info` e `/api/auth/login|logout`, qualquer requisição a `/api/locais/**` cai em `anyRequest().authenticated()`. A sessão criada no login (cookie + `HttpSessionSecurityContextRepository`) autoriza as chamadas.
- **Rationale**: menos superfície de mudança, reuso direto da fundação. No MVP só o Gestor autentica, então "autenticado" ≡ "Gestor" (RN-G-03); autorização por papel/escopo é AC-04.
- **Alternativas**: adicionar `@PreAuthorize("hasRole('Gestor')")` agora — adiável para AC-04 (ainda não há RBAC na aplicação; adicionaria complexidade fora do escopo).

## D7 — Estratégia de teste (TDD)

- **Decisão**: mesma stack da AC-01. `LocalRepositoryTest` (persistência + `findByArquivado*`) e `LocalServiceTest`/`LocalControllerTest` com Testcontainers (Postgres real) rodando no Docker; Flyway aplica `V3` no container. Frontend: specs de `local.service`, `local-list` e `local-form` no runner Vitest, com `HttpTestingController` para o serviço.
- **Rationale**: valida o mapeamento JPA e a `CHECK` do tipo contra o esquema real do Flyway (`ddl-auto=validate`); fiel ao ambiente e coerente com os testes já existentes.
- **Alternativas**: H2 em memória — rejeitado (dialeto divergente; não valida `CHECK`/RLS/pgcrypto).
