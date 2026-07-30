package br.com.maissustentavel.api.impacto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.coleta.domain.Coleta;
import br.com.maissustentavel.api.coleta.repository.ColetaRepository;
import br.com.maissustentavel.api.impacto.repository.ImpactoRepository;
import br.com.maissustentavel.api.impacto.repository.LocalAgregado;
import br.com.maissustentavel.api.impacto.repository.MensalAgregado;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Foundational — agregações de valor social: soma total (com coalesce e filtro de data),
 * por local (LEFT JOIN a partir de Local: ativo-vazio aparece com 0, arquivado-vazio não)
 * e série mensal (year/month). RN-G-06: arquivado com coletas conta.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class ImpactoRepositoryTest {

    @Autowired
    ImpactoRepository impactoRepository;
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

    private Local local(String nome, boolean arquivado) {
        Local l = new Local();
        l.setNome(nome);
        l.setEndereco("Rua X, 1");
        l.setTipo(TipoLocal.ESCOLA);
        l.setArquivado(arquivado);
        return localRepository.saveAndFlush(l);
    }

    private Ponto ponto(Local l) {
        Ponto p = new Ponto();
        p.setId(UUID.randomUUID());
        p.setLocal(l);
        p.setQrConteudo("http://localhost:4200/p/" + p.getId());
        return pontoRepository.saveAndFlush(p);
    }

    private void coleta(Ponto p, String litros, LocalDate data) {
        Coleta c = new Coleta();
        c.setPonto(p);
        c.setLitrosReais(new BigDecimal(litros));
        c.setData(data);
        coletaRepository.save(c);
    }

    private BigDecimal litrosDoLocal(List<LocalAgregado> agregados, String nome) {
        return agregados.stream().filter(a -> a.getLocalNome().equals(nome))
                .findFirst().orElseThrow().getLitros();
    }

    @Test
    void somaTotalComCoalesceEFiltroDeData() {
        Ponto p = ponto(local("Escola", false));
        coleta(p, "10", LocalDate.of(2026, 6, 10));
        coleta(p, "5.5", LocalDate.of(2026, 7, 20));

        assertEquals(0, impactoRepository.somarLitros(null, null).compareTo(new BigDecimal("15.5")));
        assertEquals(0, impactoRepository.somarLitros(LocalDate.of(2026, 7, 1), null).compareTo(new BigDecimal("5.5")));
        assertEquals(0, impactoRepository.somarLitros(null, LocalDate.of(2026, 6, 30)).compareTo(new BigDecimal("10")));
        assertEquals(0, impactoRepository.somarLitros(LocalDate.of(2000, 1, 1), LocalDate.of(2000, 12, 31)).compareTo(BigDecimal.ZERO));
    }

    @Test
    void bordasDoFiltroSaoInclusivas() {
        Ponto p = ponto(local("Escola", false));
        coleta(p, "3", LocalDate.of(2026, 7, 1));
        coleta(p, "4", LocalDate.of(2026, 7, 31));

        assertEquals(0, impactoRepository.somarLitros(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31))
                .compareTo(new BigDecimal("7")));
    }

    @Test
    void porLocalIncluiAtivoVazioComZeroEExcluiArquivadoVazio() {
        coleta(ponto(local("Escola", false)), "12.5", LocalDate.of(2026, 7, 10));
        local("Ativo Vazio", false);
        local("Arquivado Vazio", true);
        coleta(ponto(local("Arquivado Com Coleta", true)), "5", LocalDate.of(2026, 7, 11));

        List<LocalAgregado> ags = impactoRepository.agregarPorLocal(null, null);
        List<String> nomes = ags.stream().map(LocalAgregado::getLocalNome).toList();

        assertTrue(nomes.contains("Ativo Vazio"));
        assertTrue(nomes.contains("Escola"));
        assertTrue(nomes.contains("Arquivado Com Coleta")); // RN-G-06: arquivado com coleta aparece
        assertFalse(nomes.contains("Arquivado Vazio"));      // arquivado sem coleta não aparece

        assertEquals(0, litrosDoLocal(ags, "Ativo Vazio").compareTo(BigDecimal.ZERO));
        assertEquals(0, litrosDoLocal(ags, "Escola").compareTo(new BigDecimal("12.5")));
        assertEquals(0, litrosDoLocal(ags, "Arquivado Com Coleta").compareTo(new BigDecimal("5")));
    }

    @Test
    void porLocalOrdenaPorNome() {
        local("Zebra", false);
        local("Alfa", false);

        List<LocalAgregado> ags = impactoRepository.agregarPorLocal(null, null);
        assertEquals("Alfa", ags.get(0).getLocalNome());
        assertEquals("Zebra", ags.get(ags.size() - 1).getLocalNome());
    }

    @Test
    void mensalAgrupaPorAnoMesEmOrdemCronologica() {
        Ponto p = ponto(local("Escola", false));
        coleta(p, "6", LocalDate.of(2026, 6, 15));
        coleta(p, "4", LocalDate.of(2026, 7, 10));
        coleta(p, "8", LocalDate.of(2026, 7, 20));

        List<MensalAgregado> ms = impactoRepository.agregarMensal(null, null);

        assertEquals(2, ms.size());
        assertEquals(2026, ms.get(0).getAno());
        assertEquals(6, ms.get(0).getMes());
        assertEquals(0, ms.get(0).getLitros().compareTo(new BigDecimal("6")));
        assertEquals(7, ms.get(1).getMes());
        assertEquals(0, ms.get(1).getLitros().compareTo(new BigDecimal("12")));
    }

    @Test
    void arquivadoComColetaSomaNoTotal() {
        coleta(ponto(local("Arquivado", true)), "9", LocalDate.of(2026, 7, 5));
        assertEquals(0, impactoRepository.somarLitros(null, null).compareTo(new BigDecimal("9")));
    }
}
