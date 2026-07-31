package br.com.maissustentavel.api.ponto.web.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Representação de saída de um Ponto. {@code qrImagemUrl} aponta para o endpoint que
 * devolve a imagem PNG do QR ({@code GET /api/pontos/{id}/qr}).
 *
 * <p>{@code referencia} pode ser {@code null}: as estações cadastradas antes da V7 não têm, e o
 * servidor **não** substitui por um valor de reserva. Quem exibe decide o que mostrar no lugar — se o
 * servidor mandasse a referência curta preenchida, ninguém saberia mais quais estações ainda precisam
 * ser nomeadas, e a consulta da fila de trabalho da V7 deixaria de bater com a tela.
 *
 * <p>{@code localNome} acompanha {@code localId} porque a identificação de uma estação na lista é
 * "Local · referência": sem o nome, cada linha exigiria uma segunda consulta para ficar legível.
 *
 * <p>{@code qrConteudo} é o endereço público completo. Quem exibe pode abreviar; quem copia precisa
 * entregar este valor inteiro, sob pena de produzir um link que não abre.
 */
public record PontoResponse(
        UUID id,
        UUID localId,
        String localNome,
        String referencia,
        String qrConteudo,
        String qrImagemUrl,
        boolean arquivado,
        OffsetDateTime criadoEm) {
}
