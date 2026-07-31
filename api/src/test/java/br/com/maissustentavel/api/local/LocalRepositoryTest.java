package br.com.maissustentavel.api.local;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.domain.Uf;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Foundational — persistência de Local com endereço estruturado e o filtro ativo/arquivado
 * que sustenta a listagem.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class LocalRepositoryTest {

    @Autowired
    LocalRepository repositorio;

    @BeforeEach
    void limpar() {
        repositorio.deleteAll();
    }

    private Local novo(String nome, TipoLocal tipo, boolean arquivado) {
        Local local = new Local();
        local.setNome(nome);
        local.setTipo(tipo);
        local.setArquivado(arquivado);
        return LocalFixture.comEnderecoValido(local);
    }

    @Test
    void persisteEGeraIdECriadoEm() {
        Local salvo = repositorio.save(novo("Condomínio A", TipoLocal.CONDOMINIO, false));

        assertNotNull(salvo.getId());
        assertNotNull(salvo.getCriadoEm());
        assertFalse(salvo.isArquivado());
    }

    @Test
    void persisteOsComponentesDoEndereco() {
        Local salvo = repositorio.saveAndFlush(novo("Escola A", TipoLocal.ESCOLA, false));

        Local lido = repositorio.findById(salvo.getId()).orElseThrow();
        assertEquals(LocalFixture.CEP, lido.getCep());
        assertEquals(LocalFixture.RUA, lido.getRua());
        assertEquals(LocalFixture.NUMERO, lido.getNumero());
        assertEquals(LocalFixture.BAIRRO, lido.getBairro());
        assertEquals(LocalFixture.CIDADE, lido.getCidade());
        assertEquals(Uf.MG, lido.getUf());
        assertNull(lido.getComplemento(), "complemento é o único componente opcional (FR-002)");
    }

    @Test
    void persisteOComplementoQuandoInformado() {
        Local local = novo("Empresa A", TipoLocal.EMPRESA, false);
        local.setComplemento("Bloco B, sala 2");

        assertEquals("Bloco B, sala 2", repositorio.saveAndFlush(local).getComplemento());
    }

    @Test
    void aceitaNumeroNaoNumerico() {
        // FR-006: o número é texto. Imóveis sem numeração e sufixos alfabéticos existem, e tratá-lo
        // como inteiro tornaria esses cadastros impossíveis.
        Local semNumero = novo("Praça Central", TipoLocal.ESPACO_PUBLICO, false);
        semNumero.setNumero("s/n");
        assertEquals("s/n", repositorio.saveAndFlush(semNumero).getNumero());

        Local comSufixo = novo("Condomínio B", TipoLocal.CONDOMINIO, false);
        comSufixo.setNumero("120A");
        assertEquals("120A", repositorio.saveAndFlush(comSufixo).getNumero());
    }

    @Test
    void naoMapeiaOEnderecoLegado() {
        // A coluna endereco_legado existe no banco (V6) apenas como arquivo histórico do texto
        // livre anterior. Mapeá-la na entidade convidaria código novo a escrever nela —
        // ver data-model.md. Este teste guarda a decisão.
        boolean mapeiaEnderecoAntigo = Arrays.stream(Local.class.getDeclaredFields())
                .map(Field::getName)
                .anyMatch(nome -> nome.toLowerCase().contains("legado") || nome.equals("endereco"));

        assertFalse(mapeiaEnderecoAntigo, "Local não deve mapear endereco nem endereco_legado");
    }

    @Test
    void filtraAtivosEArquivados() {
        repositorio.save(novo("Ativo", TipoLocal.ESCOLA, false));
        repositorio.save(novo("Arquivado", TipoLocal.EMPRESA, true));

        List<Local> ativos = repositorio.findByArquivadoFalse();
        List<Local> arquivados = repositorio.findByArquivadoTrue();

        assertEquals(1, ativos.size());
        assertEquals("Ativo", ativos.get(0).getNome());
        assertEquals(1, arquivados.size());
        assertEquals("Arquivado", arquivados.get(0).getNome());
    }
}
