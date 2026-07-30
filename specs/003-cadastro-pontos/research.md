# Pesquisa e Decisões — Cadastrar Ponto de Coleta (CA-02)

Sem `[NEEDS CLARIFICATION]` (stack fixado pela constituição; escopo do QR e do soft delete decididos com o usuário). Registro das decisões de "como".

## D1 — Relação Local 1:N Ponto

- **Decisão**: `@ManyToOne Local` no `Ponto` (lado dono do FK `local_id`), **unidirecional**. Sem `@OneToMany` em `Local`.
- **Rationale**: o vínculo é do ponto para o local; carregar todos os pontos a partir do local não é necessário nesta feature (YAGNI). Menos acoplamento na entidade `Local` já entregue.
- **Alternativas**: bidirecional (`Local.pontos`) — adiável se surgir necessidade de navegar do local para os pontos no domínio.

## D2 — Conteúdo do QR = URL do app (decisão do usuário)

- **Decisão**: o QR codifica uma **URL** `<base>/p/{id}`, com `base` vinda de env (`APP_PONTO_BASE_URL`, default `http://localhost:4200`). O `{id}` é o UUID do ponto.
- **Rationale**: prepara o escaneamento pelo Doador (DG-01) sem implementá-lo (Art. 1.4). Como o id é único, o **conteúdo do QR é único** por construção (satisfaz RN-G-05 / FR-006). Guardamos o conteúdo (string) com restrição `unique`.
- **Alternativas**: só o UUID como texto — rejeitado (viraria retrabalho para a DG-01).

## D3 — Geração do QR com ZXing; imagem sob demanda

- **Decisão**: gerar a imagem PNG do QR com **ZXing** (`com.google.zxing:core` + `javase`). A imagem é gerada **sob demanda** no endpoint `GET /api/pontos/{id}/qr` a partir do `qr_conteudo` (determinístico ⇒ QR **estável**, FR-005). **Não** armazenamos os bytes da imagem no banco (só o conteúdo).
- **Rationale**: menos dados no banco; QR reprodutível a qualquer momento. ZXing é a biblioteca Java padrão para QR.
- **Alternativas**: armazenar o PNG (bytes) na tabela — rejeitado (redundante, pois derivável do conteúdo). Gerar no frontend — rejeitado (a subtarefa define geração por biblioteca Java).

## D4 — Atomicidade (FR-004) e id atribuído pela aplicação

- **Decisão**: o `id` do Ponto é **atribuído no serviço** (`UUID.randomUUID()`), permitindo montar `qr_conteudo` (que contém o id) **antes** de persistir. No cadastro, o serviço **gera a imagem do QR uma vez** (ZXing) para garantir que a geração funciona; qualquer falha lança exceção e a **transação faz rollback** — nenhum ponto sem QR (FR-004). Entidade usa `@Id` sem `@GeneratedValue`.
- **Rationale**: resolve o "ovo-galinha" (preciso do id para o conteúdo do QR) e garante a atomicidade exigida pela história de forma simples e testável.
- **Alternativas**: persistir e depois atualizar o conteúdo — rejeitado (duas etapas, não atômico). `@PrePersist` — rejeitado (não injeta a base-url de env com facilidade).

## D5 — Endpoints aninhados (criar/listar) + flat (item)

- **Decisão**: `POST /api/locais/{localId}/pontos` e `GET /api/locais/{localId}/pontos` (contexto do local); `GET /api/pontos/{id}/qr`, `POST /api/pontos/{id}/arquivar`, `POST /api/pontos/{id}/reativar`. Validação no service: Local **inexistente** → 404; Local **arquivado** → 409 (não aceita novos pontos).
- **Rationale**: o ponto só nasce no contexto de um local; operações sobre o item independem do local. Códigos distinguem "não existe" de "existe mas arquivado".
- **Alternativas**: tudo flat sob `/api/pontos` com `localId` no corpo — menos explícito sobre a hierarquia.

## D6 — RLS baseline na tabela `ponto`

- **Decisão**: `enable row level security` na `ponto` (sem `force`, sem política anônima), como nas tabelas de `local`/`auth`.
- **Rationale**: bloqueia acesso público via PostgREST/anon do Supabase; o backend (dono) continua acessando. Escopo por usuário = AC-04.

## D7 — Segurança reaproveitada da CA-01

- **Decisão**: **sem alterar** `SecurityConfig`. `/api/locais/**` e `/api/pontos/**` caem em `anyRequest().authenticated()`; escritas usam o CSRF double-submit já configurado; CORS já restrito. O `GET /api/pontos/{id}/qr` também exige sessão (a imagem é servida a usuários autenticados; no navegador, a tag `<img>` envia o cookie por ser same-origin via proxy).
- **Rationale**: reuso direto da fundação; no MVP "autenticado" ≡ Gestor. Autorização por papel/escopo = AC-04.

## D8 — Tratamento de erros

- **Decisão**: adicionar os handlers das exceções de Ponto (`PontoNaoEncontradoException` → 404; `LocalNaoDisponivelException` → 409) ao **handler global** já existente (`@RestControllerAdvice`), reutilizando o `ErroResponse`. O handler é transversal (não é "do local").
- **Rationale**: um único ponto de tradução de erros, consistente com a CA-01; evita duplicar DTOs de erro.

## D9 — Estratégia de teste (TDD)

- **Decisão**: `GeradorQrCodeTest` **unitário** (sem Spring) — gera o PNG de um conteúdo e **decodifica** de volta com ZXing, conferindo que o conteúdo bate (prova a unicidade/fidelidade do QR). Demais testes com Testcontainers: `PontoRepositoryTest` (1:N, filtro ativo/arquivado), `PontoServiceTest` (atomicidade, local ativo/arquivado, soft delete, unicidade), `PontoControllerTest` (endpoints, 401, 404/409, imagem PNG do QR).
- **Rationale**: cobre a regra crítica (QR único e fiel) de forma rápida e determinística, e as regras de negócio contra o Postgres real.
