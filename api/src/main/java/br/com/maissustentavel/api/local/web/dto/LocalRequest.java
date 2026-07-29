package br.com.maissustentavel.api.local.web.dto;

import br.com.maissustentavel.api.local.domain.TipoLocal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Dados de entrada para cadastrar/editar um Local. Mensagens em pt-BR (FR-013).
 */
public record LocalRequest(
        @NotBlank(message = "não pode ser vazio") String nome,
        @NotBlank(message = "não pode ser vazio") String endereco,
        @NotNull(message = "é obrigatório") TipoLocal tipo) {
}
