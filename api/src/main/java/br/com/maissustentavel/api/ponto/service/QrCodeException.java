package br.com.maissustentavel.api.ponto.service;

/**
 * Falha ao gerar a imagem do QR Code. Não verificada: propaga e faz a transação de
 * cadastro sofrer rollback (não existe ponto sem QR — FR-004).
 */
public class QrCodeException extends RuntimeException {

    public QrCodeException(Throwable causa) {
        super("Falha ao gerar o QR Code do ponto", causa);
    }
}
