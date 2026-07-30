package br.com.maissustentavel.api.impacto.service;

/**
 * Parâmetros de período inconsistentes na consulta de valor social (ex.: data inicial
 * posterior à final). Traduzida para HTTP 400 pelo ImpactoExceptionHandler.
 */
public class PeriodoInvalidoException extends RuntimeException {

    public PeriodoInvalidoException() {
        super("Período inválido");
    }
}
