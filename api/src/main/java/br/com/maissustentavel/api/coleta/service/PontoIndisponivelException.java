package br.com.maissustentavel.api.coleta.service;

import java.util.UUID;

/**
 * Lançada ao tentar registrar uma coleta num Ponto arquivado (existe, mas não recebe
 * novas coletas). Mapeada para 409 Conflict.
 */
public class PontoIndisponivelException extends RuntimeException {

    public PontoIndisponivelException(UUID pontoId) {
        super("Ponto arquivado não recebe novas coletas: " + pontoId);
    }
}
