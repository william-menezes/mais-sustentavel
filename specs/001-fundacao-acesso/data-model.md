# Modelo de Dados — Fundação de Acesso (AC-01)

Esquema versionado pelo Flyway (`V2__modelo_acesso.sql`); o Hibernate apenas valida (`ddl-auto=validate`).

## Entidades

### Papel
Função no domínio. Conjunto fixo de 4, semeado. Só o Gestor ativo no MVP.

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `nome` | text | **único**, não nulo. Valores: Gestor, Responsável, Coletor, Doador |
| `ativo` | boolean | não nulo, default `false` |

### Usuario
Pessoa que acessa o sistema.

| Campo | Tipo | Regras |
|-------|------|--------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `nome` | text | não nulo |
| `email` | text | **único**, não nulo |
| `senha_hash` | text | não nulo (hash BCrypt; preenchido na criação do usuário) |
| `criado_em` | timestamptz | não nulo, default `now()` |

### UsuarioPapel (vínculo N:N)
Associação muitos-para-muitos entre Usuario e Papel (tabela de junção; sem atributos próprios).

| Campo | Tipo | Regras |
|-------|------|--------|
| `usuario_id` | UUID | FK → `usuario(id)` `on delete cascade` |
| `papel_id` | UUID | FK → `papel(id)` |
| | | PK composta `(usuario_id, papel_id)` |

## Relacionamentos

- `Usuario` **N:N** `Papel` via `usuario_papel`. Um usuário acumula papéis; um papel pertence a vários usuários (RN-G-03).
- Mapeamento JPA: `Usuario.@ManyToMany Set<Papel> papeis` com `@JoinTable(name="usuario_papel", joinColumns=usuario_id, inverseJoinColumns=papel_id)`.
- Convenção de nomes: a estratégia padrão do Spring converte camelCase→snake_case (`senhaHash`→`senha_hash`, `criadoEm`→`criado_em`).

## Regras de validação (derivadas dos FR)

- `email` único (FR-005) e `papel.nome` único (FR-001).
- Existem exatamente os 4 papéis nomeados após a migração (FR-001/FR-004); só Gestor com `ativo=true` (FR-003).
- `senha_hash` nunca em texto puro (FR-005) — o valor é sempre um hash (responsabilidade da etapa de login/bootstrap).

## Migração `V2__modelo_acesso.sql` (referência)

```sql
-- V2 — Modelo de acesso (AC-01): usuários, papéis e vínculo N:N.

create table papel (
    id    uuid primary key default gen_random_uuid(),
    nome  text    not null unique,
    ativo boolean not null default false
);

create table usuario (
    id         uuid primary key default gen_random_uuid(),
    nome       text not null,
    email      text not null unique,
    senha_hash text not null,
    criado_em  timestamptz not null default now()
);

create table usuario_papel (
    usuario_id uuid not null references usuario(id) on delete cascade,
    papel_id   uuid not null references papel(id),
    primary key (usuario_id, papel_id)
);

-- Seed dos 4 papéis — só Gestor ativo no MVP (RN-G-03).
insert into papel (nome, ativo) values
    ('Gestor',      true),
    ('Responsável', false),
    ('Coletor',     false),
    ('Doador',      false);

-- Segurança (Art. 7.2): habilita RLS como baseline.
-- Sem política anônima => bloqueia o acesso público via PostgREST/anon do Supabase.
-- SEM 'force' => o backend (papel dono) continua acessando. Escopo por usuário = AC-04.
alter table papel        enable row level security;
alter table usuario      enable row level security;
alter table usuario_papel enable row level security;
```

> **Seed do Gestor inicial**: NÃO vai nesta migração (evita credencial versionada — ver research D4). Será criado por bootstrap idempotente via `SEED_GESTOR_EMAIL`/`SEED_GESTOR_SENHA` na etapa de login.

## Escopo desta etapa (subtarefa 3 da AC-01)

Implementar: entidades `Usuario` e `Papel`, mapeamento N:N, repositórios `UsuarioRepository`/`PapelRepository`, migração `V2` (tabelas + seed dos papéis + RLS) e os testes (TDD). **Fora desta etapa**: `senha_hash` de fato (BCrypt), seed do Gestor, login e tela — subtarefas 4 e 5.