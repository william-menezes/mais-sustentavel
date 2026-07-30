package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
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

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Foundational — persistência de Ponto (1:N Local) e filtro ativo/arquivado por local.
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
        Local l = new Local();
        l.setNome("Local");
        l.setEndereco("Rua X, 1");
        l.setTipo(TipoLocal.ESCOLA);
        return localRepository.saveAndFlush(l);
    }

    private Ponto ponto(Local local, boolean arquivado) {
        Ponto p = new Ponto();
        p.setId(UUID.randomUUID());
        p.setLocal(local);
        p.setQrConteudo("http://localhost:4200/p/" + p.getId());
        p.setArquivado(arquivado);
        return p;
    }

    @Test
    void filtraPorLocalEPorArquivado() {
        Local a = local();
        Local b = local();
        pontoRepository.save(ponto(a, false));
        pontoRepository.save(ponto(a, true));
        pontoRepository.save(ponto(b, false));

        assertEquals(1, pontoRepository.findByLocal_IdAndArquivadoFalse(a.getId()).size());
        assertEquals(1, pontoRepository.findByLocal_IdAndArquivadoTrue(a.getId()).size());
        assertEquals(1, pontoRepository.findByLocal_IdAndArquivadoFalse(b.getId()).size());
        assertEquals(0, pontoRepository.findByLocal_IdAndArquivadoTrue(b.getId()).size());
    }
}
