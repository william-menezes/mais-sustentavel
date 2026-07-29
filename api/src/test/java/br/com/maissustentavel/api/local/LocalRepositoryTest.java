package br.com.maissustentavel.api.local;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Foundational — persistência de Local e o filtro ativo/arquivado que sustenta a listagem.
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
        local.setEndereco("Rua X, 1");
        local.setTipo(tipo);
        local.setArquivado(arquivado);
        return local;
    }

    @Test
    void persisteEGeraIdECriadoEm() {
        Local salvo = repositorio.save(novo("Condomínio A", TipoLocal.CONDOMINIO, false));

        assertNotNull(salvo.getId());
        assertNotNull(salvo.getCriadoEm());
        assertFalse(salvo.isArquivado());
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
