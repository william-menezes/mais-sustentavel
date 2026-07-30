package br.com.maissustentavel.api.impacto.repository;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Projeção de agregação por local: identificação do local e a soma de litros reais
 * das suas coletas (no período). O valor social (R$) é derivado no serviço.
 */
public interface LocalAgregado {

    UUID getLocalId();

    String getLocalNome();

    BigDecimal getLitros();
}
