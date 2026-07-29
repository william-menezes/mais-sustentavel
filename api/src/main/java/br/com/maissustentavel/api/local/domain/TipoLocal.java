package br.com.maissustentavel.api.local.domain;

/**
 * Tipo de um {@link Local} — lista fechada (RN da CA-01). O valor persistido é o
 * nome ASCII da constante; o rótulo em pt-BR é responsabilidade da interface.
 */
public enum TipoLocal {
    CONDOMINIO,
    ESCOLA,
    EMPRESA,
    ESPACO_PUBLICO,
    OUTRO
}
