package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.ponto.service.GeradorQrCode;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Geração do QR (ZXing) — teste unitário: o PNG gerado decodifica de volta ao conteúdo
 * (fidelidade) e conteúdos distintos geram QRs distintos (unicidade — FR-002/006).
 */
class GeradorQrCodeTest {

    private final GeradorQrCode gerador = new GeradorQrCode();

    @Test
    void geraPngDecodificavelComOConteudo() throws Exception {
        String conteudo = "http://localhost:4200/p/" + UUID.randomUUID();

        byte[] png = gerador.gerarPng(conteudo);

        assertTrue(png.length > 0);
        assertEquals((byte) 0x89, png[0]); // assinatura PNG
        assertEquals('P', png[1]);

        BufferedImage imagem = ImageIO.read(new ByteArrayInputStream(png));
        BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(imagem)));
        Result resultado = new MultiFormatReader().decode(bitmap);
        assertEquals(conteudo, resultado.getText());
    }

    @Test
    void conteudosDistintosGeramQrsDistintos() {
        byte[] a = gerador.gerarPng("http://localhost:4200/p/a");
        byte[] b = gerador.gerarPng("http://localhost:4200/p/b");
        assertFalse(Arrays.equals(a, b));
    }
}
