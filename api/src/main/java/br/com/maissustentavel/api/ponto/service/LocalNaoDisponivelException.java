package br.com.maissustentavel.api.ponto.service;

import java.util.UUID;

/**
 * Lançada ao tentar cadastrar um Ponto em um Local arquivado (existe, mas não aceita
 * novos pontos). Mapeada para 409 Conflict.
 */
public class LocalNaoDisponivelException extends RuntimeException {

    public LocalNaoDisponivelException(UUID localId) {
        super("Local arquivado não aceita novos pontos: " + localId);
    }
}
