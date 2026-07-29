package br.com.maissustentavel.api.auth.service;

import org.springframework.security.core.Authentication;

import java.util.Set;

/**
 * Resultado da autenticação: o {@link Authentication} (para persistir na sessão) e os
 * dados públicos do usuário (nome e papéis) para a resposta.
 */
public record ResultadoAutenticacao(Authentication authentication, String nome, Set<String> papeis) {
}
