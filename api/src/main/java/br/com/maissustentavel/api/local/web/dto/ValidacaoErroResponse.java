package br.com.maissustentavel.api.local.web.dto;

import java.util.Map;

/**
 * Corpo de erro de validação: mensagem geral + mapa campo → mensagem (FR-002/003).
 */
public record ValidacaoErroResponse(String erro, Map<String, String> campos) {
}
