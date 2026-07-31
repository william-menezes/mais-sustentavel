-- V7 — Referência da estação (evolução da CA-02): rótulo curto que diz onde a estação fica dentro
-- do local ("portaria", "bloco B", "cantina").
--
-- Padrão expand / migrate / contract, com apenas a fase EXPAND aqui.
--
-- A coluna nasce NULLABLE de propósito. As estações já cadastradas não têm referência e não existe
-- valor verdadeiro para preencher; um sentinela ("estação 1", "portaria") seria pior aqui do que foi
-- no endereço, porque a referência é o TÍTULO do cartão e do painel — a mentira apareceria como o
-- nome da coisa em toda a interface e no adesivo impresso. A obrigatoriedade em cadastros novos é
-- validada no servidor (Bean Validation no PontoRequest). A tela exibe a referência curta do
-- identificador para quem ainda não tem referência, sem inventar rótulo.
-- Ver specs/007-referencia-visao-geral-pontos/research.md, decisão D1.

alter table ponto
    add column referencia text;

-- O limite de tamanho vive aqui, e não em varchar(60), pelo mesmo motivo do local_uf_check da V6:
-- todas as colunas de texto do schema são `text`, e um @Column(length) divergente esbarraria no
-- ddl-auto: validate. Admite nulo enquanto a coluna for opcional (fase expand).
alter table ponto
    add constraint ponto_referencia_tamanho_check
        check (referencia is null or char_length(referencia) <= 60);

-- Fila de trabalho do Gestor: estações que ainda precisam ser nomeadas.
--   select id, local_id from ponto where referencia is null;
