package br.com.maissustentavel.api.coleta.web.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Coletas de um ponto + total de litros recolhidos (soma exata; 0 quando não há coletas).
 */
public record ColetasDoPontoResponse(BigDecimal totalLitros, List<ColetaResponse> coletas) {
}
