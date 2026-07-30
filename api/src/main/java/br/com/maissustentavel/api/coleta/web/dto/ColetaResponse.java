package br.com.maissustentavel.api.coleta.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representação de saída de uma coleta. {@code coletorNome} pode ser {@code null}.
 */
public record ColetaResponse(
        UUID id,
        UUID pontoId,
        BigDecimal litrosReais,
        LocalDate data,
        String coletorNome,
        OffsetDateTime criadoEm) {
}
