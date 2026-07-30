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
