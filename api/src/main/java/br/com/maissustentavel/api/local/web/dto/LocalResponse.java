package br.com.maissustentavel.api.local.web.dto;

import br.com.maissustentavel.api.local.domain.TipoLocal;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representação de saída de um Local. {@code tipo} é o código do enum; o rótulo
 * pt-BR é derivado no frontend.
 */
public record LocalResponse(
        UUID id,
        String nome,
        TipoLocal tipo,
        String endereco,
        boolean arquivado,
        OffsetDateTime criadoEm) {
}
