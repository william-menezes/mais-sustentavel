package br.com.maissustentavel.api.local;

import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.Uf;

/**
 * Fixture de endereço para os testes que só precisam de um Local existente.
 *
 * <p>Existe para que os sete componentes do endereço fiquem em um único lugar: os testes de Ponto,
 * Coleta e Impacto usam Local apenas como pré-requisito, e repetir os setters em cada um deles
 * transformaria a próxima mudança no modelo de endereço em dez edições idênticas.
 *
 * <p>O complemento é deliberadamente deixado nulo — é o único campo opcional (FR-002), e os testes
 * que precisam dele o definem explicitamente.
 */
public final class LocalFixture {

    public static final String CEP = "38408100";
    public static final String RUA = "Avenida João Naves de Ávila";
    public static final String NUMERO = "1841";
    public static final String BAIRRO = "Saraiva";
    public static final String CIDADE = "Uberlândia";
    public static final Uf UF = Uf.MG;

    private LocalFixture() {
    }

    /** Preenche o endereço com valores válidos e devolve o próprio Local, para encadear. */
    public static Local comEnderecoValido(Local local) {
        local.setCep(CEP);
        local.setRua(RUA);
        local.setNumero(NUMERO);
        local.setBairro(BAIRRO);
        local.setCidade(CIDADE);
        local.setUf(UF);
        return local;
    }

    /** Corpo JSON de LocalRequest válido, para os testes de controller. */
    public static String json(String nome, String tipo) {
        return """
                {"nome":"%s","tipo":"%s","cep":"%s","rua":"%s","numero":"%s","bairro":"%s","cidade":"%s","uf":"%s"}
                """.formatted(nome, tipo, CEP, RUA, NUMERO, BAIRRO, CIDADE, UF.name());
    }
}
