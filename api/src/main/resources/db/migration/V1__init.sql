-- V1 — Base do banco (+ Sustentável)
-- Habilita pgcrypto para gerar UUIDs (gen_random_uuid()) nas próximas migrações.
-- O schema de domínio (Usuário, Papel, usuario_papel, Local, Ponto, Coleta, ...)
-- será introduzido pelas features via Spec Kit, a partir de AC-01.
create extension if not exists pgcrypto;