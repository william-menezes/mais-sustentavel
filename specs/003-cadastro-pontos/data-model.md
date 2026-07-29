# Modelo de Dados — Cadastrar Ponto de Coleta (CA-02)

Esquema versionado pelo Flyway (`V4__modelo_ponto.sql`); o Hibernate apenas valida (`ddl-auto=validate`).

## Entidade

### Ponto
Estação física de coleta dentro de um Local (RN-G-05). Usa soft delete (RN-G-06).

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | UUID | PK. **Atribuído pela aplicação** (`UUID.randomUUID()`), para compor a URL do QR antes de persistir (research D4) |
| `local_id` | UUID | **FK → `local(id)`**, não nulo. Só Locais ativos aceitam novos pontos (validado no serviço) |
| `qr_conteudo` | text | **único**, não nulo. URL `<base>/p/{id}` (research D2) |
| `arquivado` | boolean | não nulo, default `false` |
| `criado_em` | timestamptz | não nulo, default `now()`; recarregado após insert (`@Generated(INSERT)`) |

## Relacionamentos

- `Ponto` **N:1** `Local` via `@ManyToOne` (FK `local_id`), unidirecional (research D1). Um Local tem vários Pontos; um Ponto pertence a exatamente um Local.
- O QR **não** é uma coluna de imagem: `qr_conteudo` guarda o texto; a imagem PNG é gerada sob demanda (research D3).

## Regras de validação (derivadas dos FR)

- Cadastro exige um `local_id` de Local **existente e ativo** (FR-001/FR-003): inexistente → 404; arquivado → 409.
- `qr_conteudo` **único** (FR-006) — garantido pela unicidade do `id` embutido na URL + restrição `unique`.
- Geração do QR no cadastro é **atômica** (FR-004): falha ⇒ rollback, nenhum ponto persistido.
- `arquivado` alterna via arquivar/reativar; nunca hard delete (FR-008/FR-009, RN-G-06).

## Migração `V4__modelo_ponto.sql` (referência)

```sql
-- V4 — Cadastro de Ponto (CA-02): estações físicas 1:N Local, com QR e soft delete.

create table ponto (
    id          uuid        primary key default gen_random_uuid(),
    local_id    uuid        not null references local(id),
    qr_conteudo text        not null unique,
    arquivado   boolean     not null default false,
    criado_em   timestamptz not null default now()
);

create index ponto_local_idx     on ponto (local_id);
create index ponto_arquivado_idx on ponto (arquivado);

-- Segurança (Art. 7.2): RLS baseline, como nas tabelas anteriores.
alter table ponto enable row level security;
```

> `id` tem `default gen_random_uuid()` como salvaguarda, mas na prática a aplicação sempre fornece o id (research D4).
