# Modelo de Dados — Registrar Coleta (OP-03)

Esquema versionado pelo Flyway (`V5__modelo_coleta.sql`); o Hibernate apenas valida (`ddl-auto=validate`).

## Entidade

### Coleta
Registro de uma retirada física de óleo, com a medição real. Imutável (append-only).

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | UUID | PK, `gen_random_uuid()` (`@GeneratedValue`) |
| `ponto_id` | UUID | **FK → `ponto(id)`**, não nulo |
| `litros_reais` | numeric(12,3) | não nulo, **> 0** (`@Positive` + `CHECK`). Litros (RN-G-12) |
| `data` | date | não nulo; **não futura** (validado na aplicação — `@PastOrPresent`) |
| `coletor_id` | UUID | **FK → `usuario(id)`**, **nullable**. Quem registrou (auditoria) |
| `criado_em` | timestamptz | não nulo, default `now()`; recarregado após insert (`@Generated(INSERT)`) |

## Relacionamentos

- `Coleta` **N:1** `Ponto` via `@ManyToOne` (FK `ponto_id`). Um Ponto tem várias Coletas; o **total de litros** do ponto é `sum(litros_reais)` das suas coletas.
- `Coleta` **N:1** `Usuario` (coletor) via `@ManyToOne` opcional (FK `coletor_id`).

## Regras de validação (derivadas dos FR)

- `litros_reais > 0` (FR-002) — Bean Validation `@Positive` + `CHECK` no banco.
- `data` obrigatória e **não futura** (FR-003) — `@NotNull @PastOrPresent`.
- Ponto **existente** (FR-004) — validado no serviço (inexistente → 404).
- Coleta **imutável** (FR-008) — sem update/delete; sem coluna `arquivado`.

## Migração `V5__modelo_coleta.sql` (referência)

```sql
-- V5 — Registro de Coleta (OP-03): medição real de litros por ponto (append-only).

create table coleta (
    id           uuid          primary key default gen_random_uuid(),
    ponto_id     uuid          not null references ponto(id),
    litros_reais numeric(12,3) not null check (litros_reais > 0),
    data         date          not null,
    coletor_id   uuid          references usuario(id),
    criado_em    timestamptz   not null default now()
);

create index coleta_ponto_idx on coleta (ponto_id);

-- Segurança (Art. 7.2): RLS baseline, como nas tabelas anteriores.
alter table coleta enable row level security;
```
