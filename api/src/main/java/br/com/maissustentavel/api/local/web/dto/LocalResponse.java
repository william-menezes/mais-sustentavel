package br.com.maissustentavel.api.local.web.dto;

import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.domain.Uf;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representação de saída de um Local, com o endereço em componentes. {@code tipo} e {@code uf}
 * são os códigos dos enums; para o tipo o rótulo pt-BR é derivado no frontend, e para a UF o
 * código já é o rótulo.
 *
 * <p>Locais migrados do modelo de texto livre respondem com {@code cep}, {@code numero},
 * {@code bairro}, {@code cidade} e {@code uf} nulos, e {@code rua} preenchida com o texto
 * original — a interface os apresenta como endereço incompleto.
 */
public record LocalResponse(
        UUID id,
        String nome,
        TipoLocal tipo,
        String cep,
        String rua,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        Uf uf,
        boolean arquivado,
        OffsetDateTime criadoEm) {
}
