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
