-- V2 — Modelo de acesso (AC-01): usuários, papéis e vínculo N:N.

create table papel (
    id    uuid primary key default gen_random_uuid(),
    nome  text    not null unique,
    ativo boolean not null default false
);

create table usuario (
    id         uuid primary key default gen_random_uuid(),
    nome       text        not null,
    email      text        not null unique,
    senha_hash text        not null,
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
alter table papel         enable row level security;
alter table usuario       enable row level security;
alter table usuario_papel enable row level security;
