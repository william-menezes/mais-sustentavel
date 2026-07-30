package br.com.maissustentavel.api.impacto.web.dto;

import java.math.BigDecimal;

/**
 * Total geral de valor social: soma de litros reais e o valor social correspondente
 * (R$ 1,00 × litros — RN-G-02).
 */
public record ValorSocialResponse(BigDecimal litrosReais, BigDecimal valorSocial) {
}
