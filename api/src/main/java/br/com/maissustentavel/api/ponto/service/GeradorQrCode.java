package br.com.maissustentavel.api.ponto.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Gera a imagem PNG de um QR Code a partir de um conteúdo textual (biblioteca ZXing).
 * Não persiste nada: a imagem é derivada do conteúdo sempre que solicitada (QR estável).
 */
@Component
public class GeradorQrCode {

    private static final int TAMANHO = 300;

    /**
     * @return bytes de uma imagem PNG do QR Code do {@code conteudo}.
     * @throws QrCodeException se a geração falhar (o chamador deve abortar/rollback).
     */
    public byte[] gerarPng(String conteudo) {
        try {
            BitMatrix matriz = new QRCodeWriter().encode(conteudo, BarcodeFormat.QR_CODE, TAMANHO, TAMANHO);
            ByteArrayOutputStream saida = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matriz, "PNG", saida);
            return saida.toByteArray();
        } catch (WriterException | IOException e) {
            throw new QrCodeException(e);
        }
    }
}
