package br.com.maissustentavel.api.auth.web.dto;

import java.util.Set;

public record LoginResponse(String nome, Set<String> papeis) {
}
