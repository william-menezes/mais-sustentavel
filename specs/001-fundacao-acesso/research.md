# Pesquisa e Decisões — Fundação de Acesso (AC-01)

Sem `[NEEDS CLARIFICATION]` pendentes (stack fixado pela constituição). Registro das decisões de "como".

## D1 — Representação do vínculo N:N (usuario ↔ papel)

- **Decisão**: `@ManyToMany` (Usuario dono) com tabela de junção `usuario_papel(usuario_id, papel_id)` — sem entidade de associação.
- **Rationale**: hoje o vínculo não tem atributos próprios; `@ManyToMany` é o mais simples e legível (YAGNI).
- **Alternativas**: entidade `UsuarioPapel` explícita — rejeitada agora; adotável depois se surgir atributo no vínculo (ex.: data de atribuição em AC-03).

## D2 — "Só Gestor ativo no MVP"

- **Decisão**: coluna `ativo boolean` na tabela `papel` (Gestor=`true`, demais=`false`), semeada na migração.
- **Rationale**: o estado pertence ao dado; fica verificável por teste/consulta e independe da interface (atende ao critério "apenas o Gestor está ativo").
- **Alternativas**: whitelist na aplicação — rejeitada (menos testável, espalha a regra).

## D3 — Chaves primárias

- **Decisão**: `UUID` (`gen_random_uuid()`, via `pgcrypto` do `V1`) para `usuario` e `papel`; `usuario_papel` com PK composta `(usuario_id, papel_id)`.
- **Rationale**: UUID evita enumeração sequencial de ids (segurança) e combina com o `pgcrypto` já habilitado. Papéis são poucos, mas UUID mantém consistência.
- **Alternativas**: `bigserial` — rejeitado por expor contagem/sequência.

## D4 — Seed sem credencial versionada (ponto de segurança)

- **Decisão**: a migração `V2` semeia **apenas os 4 papéis** (dado estático, seguro). O **Gestor inicial** (usuário + senha) NÃO vai na migração; será criado por um **bootstrap da aplicação** que lê `SEED_GESTOR_EMAIL` e `SEED_GESTOR_SENHA` de variáveis de ambiente, de forma **idempotente** (cria só se não existir), na etapa de login.
- **Rationale**: hardcodar um hash de senha no repositório recria exatamente a dívida que acabamos de remover (credencial padrão). Art. 7.4 exige segredos só em env.
- **Alternativas**: `insert` do Gestor com hash fixo na migração — rejeitado (credencial versionada). Seed manual no painel — rejeitado (não reprodutível).

## D5 — RLS no Supabase (o que RLS realmente protege aqui)

- **Decisão**: habilitar RLS (`enable row level security`, **sem** `force`) nas três tabelas, **sem** política para o papel anônimo.
- **Rationale**: o Supabase expõe tabelas do schema `public` via PostgREST com a chave anônima. Habilitar RLS sem política anônima **bloqueia o acesso público** a `usuario`/`papel`/`usuario_papel` — ganho real de segurança. Nosso backend conecta com o papel dono (owner **ignora** RLS sem `force`), então continua funcionando.
- **Limite honesto**: isolamento **por usuário** (ex.: Responsável só vê seus locais) exige papel de aplicação não-dono + variável de sessão nas políticas — isso é **AC-04**, não AC-01. Aqui o RLS é baseline anti-exposição pública.
- **Alternativas**: `force row level security` — rejeitado (forçaria RLS no owner e, sem políticas, quebraria o backend). Não habilitar RLS — rejeitado (viola Art. 7.2 e expõe dados via PostgREST).

## D6 — Hash de senha e rate limiting (etapas seguintes)

- **Decisão**: `BCryptPasswordEncoder` (Spring Security) para `senha_hash`; **Bucket4j** para rate limiting no endpoint de login.
- **Rationale**: BCrypt é o padrão do Spring Security; Bucket4j é leve e integra por filtro. Ambos entram nas subtarefas 4 (auth) — registrados aqui para coerência do plano.
- **Escopo desta etapa**: apenas a coluna `senha_hash` (tipo/formato) é definida agora; o encoder e o rate limit são implementados no login.

## D7 — Estratégia de teste (TDD)

- **Decisão**: testes de repositório/modelo com Testcontainers (Postgres real), rodando **no Docker**; Flyway aplica as migrações no container antes dos testes.
- **Rationale**: valida o mapeamento JPA contra o esquema real do Flyway (`ddl-auto=validate`) e o seed dos papéis — fiel ao ambiente. Coerente com os testes já existentes (`@SpringBootTest` + `TestcontainersConfiguration`).
- **Alternativas**: H2 em memória — rejeitado (dialeto/расsintaxe divergente do Postgres; não valida RLS/pgcrypto).