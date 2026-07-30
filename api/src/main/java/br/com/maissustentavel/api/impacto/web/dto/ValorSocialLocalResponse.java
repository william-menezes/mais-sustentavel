package br.com.maissustentavel.api.impacto.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Valor social agregado de um local: seus litros reais e o valor social (R$ 1,00 × litros).
 */
public record ValorSocialLocalResponse(UUID localId, String localNome,
                                       BigDecimal litrosReais, BigDecimal valorSocial) {
}
