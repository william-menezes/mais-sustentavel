# Pesquisa e Decisões — Registrar Coleta (OP-03)

Sem `[NEEDS CLARIFICATION]`. Registro das decisões de "como" (inclui as duas suposições sinalizadas na spec).

## D1 — Coleta N:1 Ponto

- **Decisão**: `@ManyToOne Ponto` no `Coleta` (FK `ponto_id`), unidirecional. `@Id` UUID com `@GeneratedValue(UUID)` (não precisa do id antes de persistir, ao contrário do Ponto). `saveAndFlush` para recarregar `criadoEm` (`@Generated(INSERT)`).
- **Rationale**: espelha o padrão de `Ponto`/`Local`; a Coleta é folha da hierarquia Local→Ponto→Coleta.

## D2 — Litros e data (validação)

- **Decisão**: `litros_reais` como **BigDecimal** (`numeric(12,3)`), validado com `@NotNull @Positive` (> 0) + `CHECK (litros_reais > 0)` no banco. `data` como **LocalDate**, `@NotNull @PastOrPresent` (não futura).
- **Rationale**: litros admitem frações (RN-G-12); dupla proteção (Bean Validation + CHECK). Data é o dia da coleta, que pode ser anterior ao registro, mas nunca futura.
- **Alternativas**: `double` — rejeitado (imprecisão monetária/agregação futura em IS-01).

## D3 — "Quem registrou" = usuário autenticado (suposição confirmada)

- **Decisão**: coluna `coletor_id` **nullable** (FK → `usuario`). O **controller** obtém o usuário autenticado (`Authentication.getName()` = e-mail) e passa ao `ColetaService.registrar(...)`, que resolve via `UsuarioRepository.findByEmail` e associa (se encontrado). Fica **null** quando não há usuário resolvível.
- **Rationale**: auditoria de quem registrou, sem acoplar o service ao `SecurityContextHolder` (recebe o e-mail por parâmetro → testável). Campo preparado para o papel **Coletor** (AC-03), coerente com Art. 1.4.
- **Alternativas**: resolver via `SecurityContextHolder` dentro do service — rejeitado (dificulta teste); deixar sempre null — rejeitado (perde a auditoria barata).

## D4 — Registrar em ponto arquivado: permitido (suposição confirmada)

- **Decisão**: o registro valida apenas a **existência** do Ponto (inexistente → 404, reusando `PontoNaoEncontradoException`). Não bloqueia por ponto arquivado.
- **Rationale**: uma coleta física pode ser lançada após o ponto sair de operação; o arquivamento preserva histórico (RN-G-06) e não deve impedir o registro da medição real. Diferente da CA-02 (criar ponto exige local ativo), aqui a medição é um fato passado.
- **Alternativas**: bloquear em ponto arquivado — rejeitado (impediria lançar coletas legítimas atrasadas).

## D5 — Coleta imutável (append-only)

- **Decisão**: sem endpoints de editar/remover/arquivar coleta. A tabela não tem `arquivado`.
- **Rationale**: coleta é um dado de medição; sua integridade sustenta o valor social (RN-G-02). RN-G-06 (soft delete) cobre Local/Ponto/vínculo, **não** Coleta.

## D6 — Endpoints aninhados; GET com total + lista

- **Decisão**: `POST /api/pontos/{pontoId}/coletas` (registrar); `GET /api/pontos/{pontoId}/coletas` retorna `{ totalLitros, coletas[] }`. O total é somado no banco (`coalesce(sum(litros_reais), 0)`).
- **Rationale**: a coleta vive no contexto do ponto; devolver o total junto atende ao critério "entra no total" sem N+1 no cliente.

## D7 — RLS e segurança reaproveitada

- **Decisão**: RLS baseline na tabela `coleta`; **sem** alterar `SecurityConfig` (`/api/pontos/**` já cai em `authenticated()`; escritas usam o CSRF já configurado; CORS restrito).
- **Rationale**: reuso direto; no MVP "autenticado" ≡ Gestor.

## D8 — Valor social é IS-01

- **Decisão**: a OP-03 expõe o **total de litros** por ponto; o **valor social em R$** e a **agregação por local/período** são a **IS-01** (próxima história).
- **Rationale**: mantém as histórias enxutas e rastreáveis (Art. 4.4).

## D9 — Estratégia de teste (TDD)

- **Decisão**: `ColetaRepositoryTest` (vínculo ao ponto, soma de litros), `ColetaServiceTest` (litros ≤ 0 e data futura recusados; ponto inexistente → 404; coletor resolvido por e-mail e null quando ausente; total correto; imutabilidade — sem métodos de edição), `ColetaControllerTest` (201; 400 em litros/data inválidos; 404 ponto inexistente; GET total+lista; 401 sem sessão).
- **Rationale**: cobre as regras críticas (litros>0, data não futura, total exato) contra o Postgres real.
