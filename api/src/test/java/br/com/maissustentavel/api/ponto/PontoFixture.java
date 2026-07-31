package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.ponto.domain.Ponto;

import java.util.UUID;

/**
 * Fixture de Ponto para os testes que só precisam de uma estação existente.
 *
 * <p>Existe pelo mesmo motivo que a {@code LocalFixture}: os testes de Coleta e de Impacto usam Ponto
 * apenas como pré-requisito, e repetir a construção em cada um deles transforma a próxima mudança no
 * modelo em seis edições idênticas. Aqui a fixture nasce junto com o campo novo, e não depois de a
 * repetição já ter aparecido.
 *
 * <p>O {@code id} é atribuído aqui, e não pelo banco, porque o conteúdo do QR o contém — a entidade
 * precisa do identificador antes de ser persistida.
 */
public final class PontoFixture {

    /** Referência de estação usada por quem não se importa com o valor dela. */
    public static final String REFERENCIA = "portaria";

    private PontoFixture() {
    }

    /** Estação ativa, com referência padrão. */
    public static Ponto ativo(Local local) {
        return construir(local, REFERENCIA, false);
    }

    /** Estação com a situação escolhida, para os testes de filtro por arquivamento. */
    public static Ponto comSituacao(Local local, boolean arquivado) {
        return construir(local, REFERENCIA, arquivado);
    }

    /** Estação com referência escolhida, para os testes de ordenação e identificação. */
    public static Ponto comReferencia(Local local, String referencia) {
        return construir(local, referencia, false);
    }

    /**
     * Estação **sem** referência: representa o acervo cadastrado antes da V7. A coluna aceita nulo de
     * propósito (FR-012), então este caso precisa ser construível nos testes.
     */
    public static Ponto semReferencia(Local local) {
        return construir(local, null, false);
    }

    private static Ponto construir(Local local, String referencia, boolean arquivado) {
        Ponto ponto = new Ponto();
        ponto.setId(UUID.randomUUID());
        ponto.setLocal(local);
        ponto.setReferencia(referencia);
        ponto.setQrConteudo("http://localhost:4200/p/" + ponto.getId());
        ponto.setArquivado(arquivado);
        return ponto;
    }

    /** Corpo JSON de PontoRequest válido, para os testes de controller. */
    public static String json(String referencia) {
        return """
                {"referencia":"%s"}
                """.formatted(referencia);
    }
}
