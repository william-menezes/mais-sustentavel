package br.com.maissustentavel.api.impacto.web.dto;

import java.math.BigDecimal;

/**
 * Ponto da série mensal: competência "YYYY-MM", litros reais do mês e valor social
 * (R$ 1,00 × litros).
 */
public record ValorSocialMensalResponse(String competencia,
                                        BigDecimal litrosReais, BigDecimal valorSocial) {
}
