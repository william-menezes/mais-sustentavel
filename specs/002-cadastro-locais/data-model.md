# Modelo de Dados — Cadastrar Local (CA-01)

Esquema versionado pelo Flyway (`V3__modelo_local.sql`); o Hibernate apenas valida (`ddl-auto=validate`).

## Entidade

### Local
Instituição atendida pela operação. Passará a ter pontos de coleta (1:N) na CA-02 — **fora do escopo** aqui.

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | UUID | PK, default `gen_random_uuid()` (pgcrypto do `V1`) |
| `nome` | text | não nulo; não vazio (validação FR-002) |
| `endereco` | text | não nulo; não vazio (validação FR-002) |
| `tipo` | text | não nulo; **CHECK** ∈ {`CONDOMINIO`, `ESCOLA`, `EMPRESA`, `ESPACO_PUBLICO`, `OUTRO`} (FR-003) |
| `arquivado` | boolean | não nulo, default `false` (soft delete, FR-005/FR-006) |
| `criado_em` | timestamptz | não nulo, default `now()` |

- **Sem `unique` no `nome`**: instituições homônimas são permitidas (spec, Assumptions).
- Mapeamento JPA: `tipo` como `@Enumerated(EnumType.STRING)` do enum `TipoLocal`; `criado_em` `insertable=false, updatable=false` (preenchido pelo default do banco) — mesmo padrão de `Usuario.criadoEm`.
- Estratégia de nomes: camelCase→snake_case padrão do Spring (`criadoEm`→`criado_em`).

### Enum TipoLocal (domínio)

| Constante | Rótulo pt-BR (UI) |
|-----------|-------------------|
| `CONDOMINIO` | Condomínio |
| `ESCOLA` | Escola |
| `EMPRESA` | Empresa |
| `ESPACO_PUBLICO` | Espaço público |
| `OUTRO` | Outro |

> O **valor persistido** é o nome ASCII da constante; o **rótulo** é responsabilidade da interface (backend expõe o código; frontend mapeia para pt-BR).

## Transições de estado (arquivamento)

```text
        criar
          │
          ▼
      [ ATIVO ] ──── arquivar ────▶ [ ARQUIVADO ]
          ▲                              │
          └──────── reativar ────────────┘
```

- `arquivar` sobre já-ARQUIVADO e `reativar` sobre já-ATIVO são **idempotentes** (sem erro, sem duplicação — FR-010).
- Editar (nome/tipo/endereco) é permitido em ambos os estados; não altera `arquivado`.

## Regras de validação (derivadas dos FR)

- `nome` e `endereco` `@NotBlank` (trim; só-espaços é inválido) — FR-002, edge case.
- `tipo` `@NotNull` e dentro do enum; corpo com valor fora da lista → 400 — FR-003.
- Operações sobre `id` inexistente → `LocalNaoEncontradoException` → 404 — FR-010.
- Nenhuma remoção física (sem `DELETE`) — FR-006 / Art. 2.6.

## Migração `V3__modelo_local.sql` (referência)

```sql
-- V3 — Cadastro de Local (CA-01): instituições atendidas, com soft delete.

create table local (
    id        uuid        primary key default gen_random_uuid(),
    nome      text        not null,
    endereco  text        not null,
    tipo      text        not null,
    arquivado boolean     not null default false,
    criado_em timestamptz not null default now(),
    constraint local_tipo_check
        check (tipo in ('CONDOMINIO', 'ESCOLA', 'EMPRESA', 'ESPACO_PUBLICO', 'OUTRO'))
);

-- Acelera a listagem padrão (ativos) e a visão de arquivados.
create index local_arquivado_idx on local (arquivado);

-- Segurança (Art. 7.2): RLS baseline, como no V2.
-- Sem política anônima => bloqueia acesso público via PostgREST/anon do Supabase.
-- SEM 'force' => backend (papel dono) continua acessando. Escopo por usuário = AC-04.
alter table local enable row level security;
```

## Escopo desta feature

Implementar: entidade `Local` + enum `TipoLocal`, `LocalRepository`, `LocalService` (CRUD + arquivar/reativar), `LocalController` + DTOs, handler de erro, migração `V3` (tabela + CHECK + índice + RLS) e a UI Angular (`/locais`: listagem + formulário). Tudo com testes primeiro (TDD). **Fora**: pontos/QR (CA-02), vínculo Responsável (CA-04), RBAC/escopo (AC-04), listagem avançada (VH-01).
