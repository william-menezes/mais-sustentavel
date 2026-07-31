package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.LocalFixture;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Foundational — persistência de Ponto (1:N Local), referência da estação e filtro ativo/arquivado.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PontoRepositoryTest {

    @Autowired
    PontoRepository pontoRepository;
    @Autowired
    LocalRepository localRepository;

    @BeforeEach
    void limpar() {
        pontoRepository.deleteAll();
        localRepository.deleteAll();
    }

    private Local local() {
        return local("Local");
    }

    private Local local(String nome) {
        Local l = new Local();
        l.setNome(nome);
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        return localRepository.saveAndFlush(l);
    }

    @Test
    void filtraPorLocalEPorArquivado() {
        Local a = local("A");
        Local b = local("B");
        pontoRepository.save(PontoFixture.comSituacao(a, false));
        pontoRepository.save(PontoFixture.comSituacao(a, true));
        pontoRepository.save(PontoFixture.comSituacao(b, false));

        assertEquals(1, pontoRepository.findByLocal_IdAndArquivadoFalse(a.getId()).size());
        assertEquals(1, pontoRepository.findByLocal_IdAndArquivadoTrue(a.getId()).size());
        assertEquals(1, pontoRepository.findByLocal_IdAndArquivadoFalse(b.getId()).size());
        assertEquals(0, pontoRepository.findByLocal_IdAndArquivadoTrue(b.getId()).size());
    }

    @Test
    void persisteAReferenciaDaEstacao() {
        Ponto salvo = pontoRepository.saveAndFlush(PontoFixture.comReferencia(local(), "bloco B"));

        assertEquals("bloco B", pontoRepository.findById(salvo.getId()).orElseThrow().getReferencia());
    }

    @Test
    void aceitaEstacaoSemReferencia() {
        // O acervo cadastrado antes da V7 não tem referência, e inventar uma foi recusado (FR-012).
        Ponto salvo = pontoRepository.saveAndFlush(PontoFixture.semReferencia(local()));

        assertNull(pontoRepository.findById(salvo.getId()).orElseThrow().getReferencia());
    }

    @Test
    void recusaReferenciaAcimaDoLimite() {
        // O limite é do banco, por CHECK: a validação da aplicação não é a única linha de defesa
        // quanto ao tamanho (FR-017).
        Ponto excessivo = PontoFixture.comReferencia(local(), "x".repeat(61));

        assertThrows(Exception.class, () -> pontoRepository.saveAndFlush(excessivo));
    }
}
