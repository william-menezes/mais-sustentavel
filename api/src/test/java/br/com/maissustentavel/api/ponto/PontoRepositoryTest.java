package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.LocalFixture;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;

import java.util.List;
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

    private static final String PORTARIA = "portaria";
    private static final String CANTINA = "cantina";

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
    void listaGlobalSeparaAtivosDeArquivados() {
        Local a = local("A");
        pontoRepository.save(PontoFixture.comSituacao(a, false));
        pontoRepository.save(PontoFixture.comSituacao(a, true));

        assertEquals(1, pontoRepository.buscarTodos(false).size());
        assertEquals(1, pontoRepository.buscarTodos(true).size());
    }

    @Test
    void listaGlobalTrazOLocalJunto() {
        // Prova o `join fetch`: fora da transação do repositório, ler o nome do local só funciona se a
        // associação vier carregada. Sem isso, exibir "Local · referência" custaria uma consulta por
        // linha — o N+1 que esta feature evita em dois lugares.
        pontoRepository.saveAndFlush(PontoFixture.ativo(local("EMEF Zaida Barbosa")));

        Ponto encontrado = pontoRepository.buscarTodos(false).getFirst();

        assertEquals("EMEF Zaida Barbosa", encontrado.getLocal().getNome());
    }

    @Test
    void listaGlobalOrdenaPorLocalDepoisPorReferencia() {
        Local zeta = local("Zeta");
        Local alfa = local("Alfa");
        pontoRepository.save(PontoFixture.comReferencia(zeta, PORTARIA));
        pontoRepository.save(PontoFixture.comReferencia(alfa, PORTARIA));
        pontoRepository.save(PontoFixture.comReferencia(alfa, CANTINA));

        var ordenados = pontoRepository.buscarTodos(false).stream()
                .map(p -> p.getLocal().getNome() + "/" + p.getReferencia())
                .toList();

        assertEquals(List.of("Alfa/cantina", "Alfa/portaria", "Zeta/portaria"), ordenados);
    }

    @Test
    void estacaoSemReferenciaVaiParaOFimDoGrupoDoSeuLocal() {
        // Agrupar estações do mesmo local é o objetivo da ordenação; as sem nome vão ao fim do grupo,
        // e não ao fim da lista, senão sairiam do lado do local errado.
        Local alfa = local("Alfa");
        Local beta = local("Beta");
        pontoRepository.save(PontoFixture.semReferencia(alfa));
        pontoRepository.save(PontoFixture.comReferencia(alfa, PORTARIA));
        pontoRepository.save(PontoFixture.comReferencia(beta, CANTINA));

        var ordenados = pontoRepository.buscarTodos(false).stream()
                .map(p -> p.getLocal().getNome() + "/" + p.getReferencia())
                .toList();

        assertEquals(List.of("Alfa/portaria", "Alfa/null", "Beta/cantina"), ordenados);
    }

    @Test
    void recusaReferenciaAcimaDoLimite() {
        // O limite é do banco, por CHECK: a validação da aplicação não é a única linha de defesa
        // quanto ao tamanho (FR-017).
        Ponto excessivo = PontoFixture.comReferencia(local(), "x".repeat(61));

        assertThrows(Exception.class, () -> pontoRepository.saveAndFlush(excessivo));
    }
}
