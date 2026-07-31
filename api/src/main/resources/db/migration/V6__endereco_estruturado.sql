-- V6 — Endereço estruturado de Local (evolução da CA-01): CEP, rua, número, complemento,
-- bairro, cidade e UF no lugar do texto livre.
--
-- Padrão expand / migrate / contract, com apenas a fase EXPAND aqui.
--
-- As colunas novas nascem NULLABLE de propósito: os registros existentes não têm CEP, número,
-- bairro, cidade nem UF, e preenchê-los com sentinela ('00000000', 'A INFORMAR') gravaria dado
-- falso que se propaga a relatórios — e, no caso da UF, quebraria a própria lista fechada. A
-- obrigatoriedade é validada no servidor (Bean Validation nos DTOs). O endurecimento para
-- NOT NULL é migração futura, depois que os cadastros legados forem completados.
-- Ver specs/006-endereco-estruturado-locais/research.md, decisão D1.

alter table local
    add column cep         text,
    add column rua         text,
    add column numero      text,
    add column complemento text,
    add column bairro      text,
    add column cidade      text,
    add column uf          text;

-- Preserva o que já existia: o texto livre é predominantemente logradouro.
update local set rua = endereco where endereco is not null;

-- Arquivo histórico do modelo antigo (FR-008). Não é mapeada na entidade — código novo nunca
-- escreve aqui. Serve para completar os cadastros migrados e para auditoria.
alter table local rename column endereco to endereco_legado;
alter table local alter column endereco_legado drop not null;

-- Lista fechada da UF, no mesmo padrão do local_tipo_check da V3. Admite nulo enquanto a coluna
-- for opcional (fase expand).
alter table local
    add constraint local_uf_check
        check (uf is null or uf in (
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
            'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ));

-- Fila de trabalho do Gestor: locais que vieram do texto livre e ainda não têm endereço completo.
--   select id, nome, endereco_legado from local where endereco_legado is not null and cep is null;
