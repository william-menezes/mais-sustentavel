package br.com.maissustentavel.api.coleta.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dados de entrada para registrar uma coleta. Mensagens em pt-BR (FR-012).
 */
public record ColetaRequest(
        @NotNull(message = "é obrigatório") @Positive(message = "deve ser maior que zero") BigDecimal litrosReais,
        @NotNull(message = "é obrigatória") @PastOrPresent(message = "não pode ser futura") LocalDate data) {
}
