package br.com.maissustentavel.api.impacto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.coleta.domain.Coleta;
import br.com.maissustentavel.api.coleta.repository.ColetaRepository;
import br.com.maissustentavel.api.impacto.service.ImpactoService;
import br.com.maissustentavel.api.impacto.service.PeriodoInvalidoException;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialLocalResponse;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialMensalResponse;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialResponse;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regras de valor social: conversão R$ 1,00/litro (escala 2), reconciliação
 * (Σ por local == Σ mensal == total), estado vazio, período inválido e competência.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class ImpactoServiceTest {

    @Autowired
    ImpactoService servico;
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

    private Ponto ponto(String nomeLocal) {
        Local l = new Local();
        l.setNome(nomeLocal);
        l.setEndereco("Rua X, 1");
        l.setTipo(TipoLocal.ESCOLA);
        localRepository.saveAndFlush(l);
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

    @Test
    void valorSocialIgualLitrosVezesUmRealComEscalaDois() {
        coleta(ponto("Escola"), "12.5", LocalDate.of(2026, 7, 10));

        ValorSocialResponse r = servico.total(null, null);

        assertEquals(0, r.litrosReais().compareTo(new BigDecimal("12.5")));
        assertEquals(0, r.valorSocial().compareTo(new BigDecimal("12.50")));
        assertEquals(2, r.valorSocial().scale());
    }

    @Test
    void estadoVazioRetornaZerosEListasVazias() {
        ValorSocialResponse total = servico.total(null, null);
        assertEquals(0, total.litrosReais().compareTo(BigDecimal.ZERO));
        assertEquals(0, total.valorSocial().compareTo(BigDecimal.ZERO));
        assertTrue(servico.porLocal(null, null).isEmpty());
        assertTrue(servico.mensal(null, null).isEmpty());
    }

    @Test
    void reconciliacaoPorLocalEMensalIgualAoTotal() {
        Ponto escola = ponto("Escola");
        Ponto condominio = ponto("Condominio");
        coleta(escola, "6", LocalDate.of(2026, 6, 15));
        coleta(escola, "4", LocalDate.of(2026, 7, 10));
        coleta(condominio, "8", LocalDate.of(2026, 7, 12));

        BigDecimal total = servico.total(null, null).valorSocial();
        BigDecimal somaLocais = servico.porLocal(null, null).stream()
                .map(ValorSocialLocalResponse::valorSocial)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal somaMeses = servico.mensal(null, null).stream()
                .map(ValorSocialMensalResponse::valorSocial)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, total.compareTo(new BigDecimal("18.00")));
        assertEquals(0, somaLocais.compareTo(total));
        assertEquals(0, somaMeses.compareTo(total));
    }

    @Test
    void periodoInvalidoLancaExcecao() {
        assertThrows(PeriodoInvalidoException.class,
                () -> servico.total(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 7, 1)));
        assertThrows(PeriodoInvalidoException.class,
                () -> servico.porLocal(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 7, 1)));
        assertThrows(PeriodoInvalidoException.class,
                () -> servico.mensal(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 7, 1)));
    }

    @Test
    void competenciaFormatadaComoAnoMes() {
        coleta(ponto("Escola"), "6", LocalDate.of(2026, 6, 15));

        List<ValorSocialMensalResponse> ms = servico.mensal(null, null);
        assertEquals("2026-06", ms.get(0).competencia());
    }
}
