package br.com.maissustentavel.api.local.domain;

/**
 * Unidades federativas do Brasil — lista fechada (FR-004).
 *
 * <p>Diferente de {@link TipoLocal}, aqui o código <em>é</em> o rótulo: "MG" se apresenta como
 * "MG" na interface, então não existe mapa de tradução para pt-BR.
 */
public enum Uf {
    AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG,
    PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO
}
