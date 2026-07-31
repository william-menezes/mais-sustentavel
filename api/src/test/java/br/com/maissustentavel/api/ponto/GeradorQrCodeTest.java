package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.ponto.service.GeradorQrCode;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Geração do QR (ZXing) — teste unitário: o PNG gerado decodifica de volta ao conteúdo
 * (fidelidade) e conteúdos distintos geram QRs distintos (unicidade — FR-002/006).
 */
class GeradorQrCodeTest {

    /**
     * A imagem gerada é um QR "puro": renderizado, alinhado ao pixel, sem foto nem
     * perspectiva. O hint {@code PURE_BARCODE} faz o ZXing ler a grade de módulos
     * diretamente, em vez de rodar a detecção de padrões de localização — que é
     * pensada para fotos e falha em cerca de 2% dos conteúdos, tornando o teste
     * intermitente (`NotFoundException` esporádico no CI).
     */
    private static final Map<DecodeHintType, Object> QR_PURO =
            Map.of(DecodeHintType.PURE_BARCODE, Boolean.TRUE);

    private final GeradorQrCode gerador = new GeradorQrCode();

    @Test
    void geraPngDecodificavelComOConteudo() throws Exception {
        // Id fixo em vez de UUID.randomUUID(): o que se verifica aqui é fidelidade, e
        // sortear o conteúdo a cada execução só reintroduziria não-determinismo.
        String conteudo = "http://localhost:4200/p/3f2b7c14-9d5a-4e6b-8f10-2c7a5b9e1d34";

        byte[] png = gerador.gerarPng(conteudo);

        assertTrue(png.length > 0);
        assertEquals((byte) 0x89, png[0]); // assinatura PNG
        assertEquals('P', png[1]);

        BufferedImage imagem = ImageIO.read(new ByteArrayInputStream(png));
        BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(imagem)));
        Result resultado = new QRCodeReader().decode(bitmap, QR_PURO);
        assertEquals(conteudo, resultado.getText());
    }

    @Test
    void conteudosDistintosGeramQrsDistintos() {
        byte[] a = gerador.gerarPng("http://localhost:4200/p/a");
        byte[] b = gerador.gerarPng("http://localhost:4200/p/b");
        assertFalse(Arrays.equals(a, b));
    }
}
