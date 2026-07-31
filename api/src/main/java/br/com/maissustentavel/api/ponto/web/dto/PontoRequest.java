package br.com.maissustentavel.api.ponto.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dados de entrada para cadastrar uma estação e para corrigir a referência dela.
 * Mensagens em pt-BR (FR-052).
 *
 * <p>{@code @NotBlank} também cobre o caso de borda "apenas espaços em branco", que aqui não é
 * detalhe: a coluna aceita nulo para o acervo cadastrado antes da V7, então aceitar {@code "   "}
 * e normalizá-lo para nulo criaria uma estação anônima nova indistinguível das antigas — a
 * obrigatoriedade seria furada por dentro (FR-011, FR-018).
 *
 * <p><strong>Sem {@code localId}</strong>: o local não é aceito no corpo nem no cadastro (vem do
 * caminho) nem na edição (não pode mudar). A RN-G-05 mantém o ponto vinculado ao local, e o QR já
 * impresso e colado aponta para uma estação que o morador associa àquele endereço — mover
 * reescreveria o histórico de coletas de dois locais, inclusive valor social já publicado.
 */
public record PontoRequest(
        @NotBlank(message = "não pode ser vazio")
        @Size(max = 60, message = "deve ter no máximo 60 caracteres") String referencia) {
}
