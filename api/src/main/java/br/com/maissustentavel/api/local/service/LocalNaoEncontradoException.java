package br.com.maissustentavel.api.local.service;

import java.util.UUID;

/**
 * Lançada quando um Local referenciado por id não existe. Mapeada para 404 pelo
 * handler global, com mensagem genérica (sem vazar detalhes internos — FR-012).
 */
public class LocalNaoEncontradoException extends RuntimeException {

    public LocalNaoEncontradoException(UUID id) {
        super("Local não encontrado: " + id);
    }
}
