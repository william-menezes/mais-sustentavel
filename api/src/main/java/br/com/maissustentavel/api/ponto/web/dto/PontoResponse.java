package br.com.maissustentavel.api.ponto.web.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representação de saída de um Ponto. {@code qrImagemUrl} aponta para o endpoint que
 * devolve a imagem PNG do QR ({@code GET /api/pontos/{id}/qr}).
 */
public record PontoResponse(
        UUID id,
        UUID localId,
        String qrConteudo,
        String qrImagemUrl,
        boolean arquivado,
        OffsetDateTime criadoEm) {
}
