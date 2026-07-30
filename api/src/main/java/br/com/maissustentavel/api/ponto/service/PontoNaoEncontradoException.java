package br.com.maissustentavel.api.ponto.service;

import java.util.UUID;

/** Lançada quando um Ponto referenciado por id não existe. Mapeada para 404. */
public class PontoNaoEncontradoException extends RuntimeException {

    public PontoNaoEncontradoException(UUID id) {
        super("Ponto não encontrado: " + id);
    }
}
