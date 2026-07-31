package br.com.maissustentavel.api.coleta;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.coleta.domain.Coleta;
import br.com.maissustentavel.api.coleta.repository.ColetaRepository;
import br.com.maissustentavel.api.local.LocalFixture;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.ponto.PontoFixture;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Foundational — persistência de Coleta (N:1 Ponto), soma de litros e ordenação por data.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class ColetaRepositoryTest {

    @Autowired
    ColetaRepository coletaRepository;
    @Autowired
    PontoRepository pontoRepository;
    @Autowired
    LocalRepository localRepository;

    @BeforeEach
    void limpar() {
        coletaRepository.deleteAll();
        pontoRepository.deleteAll();
        localRepository.deleteAll();
    }

    private Ponto ponto() {
        Local l = new Local();
        l.setNome("Local");
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        localRepository.saveAndFlush(l);
        Ponto p = PontoFixture.ativo(l);
        return pontoRepository.saveAndFlush(p);
    }

    private Coleta coleta(Ponto ponto, String litros, LocalDate data) {
        Coleta c = new Coleta();
        c.setPonto(ponto);
        c.setLitrosReais(new BigDecimal(litros));
        c.setData(data);
        return c;
    }

    @Test
    void somaEFiltraPorPonto() {
        Ponto a = ponto();
        Ponto b = ponto();
        coletaRepository.save(coleta(a, "10", LocalDate.now().minusDays(2)));
        coletaRepository.save(coleta(a, "5.5", LocalDate.now().minusDays(1)));
        coletaRepository.save(coleta(b, "3", LocalDate.now()));

        assertEquals(2, coletaRepository.findByPonto_IdOrderByDataDesc(a.getId()).size());
        assertEquals(0, coletaRepository.somarLitrosPorPonto(a.getId()).compareTo(new BigDecimal("15.5")));
        assertEquals(0, coletaRepository.somarLitrosPorPonto(b.getId()).compareTo(new BigDecimal("3")));
        assertEquals(0, coletaRepository.somarLitrosPorPonto(UUID.randomUUID()).compareTo(BigDecimal.ZERO));
    }

    @Test
    void ordenaPorDataDesc() {
        Ponto a = ponto();
        coletaRepository.save(coleta(a, "1", LocalDate.now().minusDays(5)));
        coletaRepository.save(coleta(a, "2", LocalDate.now().minusDays(1)));

        List<Coleta> lista = coletaRepository.findByPonto_IdOrderByDataDesc(a.getId());
        assertTrue(lista.get(0).getData().isAfter(lista.get(1).getData()));
    }
}
