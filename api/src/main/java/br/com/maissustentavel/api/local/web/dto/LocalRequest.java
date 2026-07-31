package br.com.maissustentavel.api.local.web.dto;

import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.domain.Uf;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * Dados de entrada para cadastrar/editar um Local, com o endereço em componentes.
 * Mensagens em pt-BR (FR-027).
 *
 * <p>Todos os componentes são obrigatórios menos o {@code complemento} (FR-002). O {@code cep}
 * chega com oito dígitos, sem formatação — a máscara é da interface (FR-003, FR-005).
 * {@code @NotBlank} também cobre o caso de borda "apenas espaços em branco".
 */
public record LocalRequest(
        @NotBlank(message = "não pode ser vazio") String nome,
        @NotNull(message = "é obrigatório") TipoLocal tipo,
        @NotBlank(message = "não pode ser vazio")
        @Pattern(regexp = "\\d{8}", message = "deve ter 8 dígitos") String cep,
        @NotBlank(message = "não pode ser vazio") String rua,
        @NotBlank(message = "não pode ser vazio") String numero,
        String complemento,
        @NotBlank(message = "não pode ser vazio") String bairro,
        @NotBlank(message = "não pode ser vazio") String cidade,
        @NotNull(message = "é obrigatório") Uf uf) {
}
