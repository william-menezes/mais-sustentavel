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
-- Sem política anônima => bloqueia acesso público via PostgREST/anon do Supabase.
alter table ponto enable row level security;
