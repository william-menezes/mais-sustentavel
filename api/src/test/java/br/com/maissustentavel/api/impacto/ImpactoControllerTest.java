package br.com.maissustentavel.api.impacto;

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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integração REST de impacto: total (US1), por local (US2) e mensal/filtro (US3),
 * mais 401 sem sessão e 400 de período/formato inválidos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class ImpactoControllerTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    LocalRepository localRepository;
    @Autowired
    PontoRepository pontoRepository;
    @Autowired
    ColetaRepository coletaRepository;

    @BeforeEach
    void limpar() {
        coletaRepository.deleteAll();
        pontoRepository.deleteAll();
        localRepository.deleteAll();
    }

    private Local local(String nome, boolean arquivado) {
        Local l = new Local();
        l.setNome(nome);
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        l.setArquivado(arquivado);
        return localRepository.saveAndFlush(l);
    }

    private Ponto ponto(Local l) {
        Ponto p = PontoFixture.ativo(l);
        return pontoRepository.saveAndFlush(p);
    }

    private void coleta(Ponto p, String litros, LocalDate data) {
        Coleta c = new Coleta();
        c.setPonto(p);
        c.setLitrosReais(new BigDecimal(litros));
        c.setData(data);
        coletaRepository.save(c);
    }

    // ---------- US1: total ----------

    @Test
    void totalRetorna200ComValorSocial() throws Exception {
        coleta(ponto(local("Escola", false)), "12.5", LocalDate.of(2026, 7, 10));

        mockMvc.perform(get("/api/impacto/valor-social").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.litrosReais").value(closeTo(12.5, 0.0001)))
                .andExpect(jsonPath("$.valorSocial").value(closeTo(12.5, 0.0001)));
    }

    @Test
    void semColetasRetornaZeros() throws Exception {
        mockMvc.perform(get("/api/impacto/valor-social").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorSocial").value(closeTo(0.0, 0.0001)));
    }

    @Test
    void semSessaoRetorna401() throws Exception {
        mockMvc.perform(get("/api/impacto/valor-social"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void periodoInvalidoRetorna400() throws Exception {
        mockMvc.perform(get("/api/impacto/valor-social").with(user("gestor"))
                        .param("de", "2026-08-01").param("ate", "2026-07-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("Período")));
    }

    @Test
    void dataFormatoInvalidoRetorna400() throws Exception {
        mockMvc.perform(get("/api/impacto/valor-social").with(user("gestor")).param("de", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("inválidos")));
    }

    // ---------- US2: por local ----------

    @Test
    void porLocalOrdenadoComAtivoVazioEReconcilia() throws Exception {
        coleta(ponto(local("Escola", false)), "12.5", LocalDate.of(2026, 7, 10));
        local("Ativo Vazio", false);

        mockMvc.perform(get("/api/impacto/valor-social/por-local").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].localNome").value("Ativo Vazio"))
                .andExpect(jsonPath("$[0].valorSocial").value(closeTo(0.0, 0.0001)))
                .andExpect(jsonPath("$[1].localNome").value("Escola"))
                .andExpect(jsonPath("$[1].valorSocial").value(closeTo(12.5, 0.0001)));
    }

    @Test
    void porLocalSemLocaisRetornaListaVazia() throws Exception {
        mockMvc.perform(get("/api/impacto/valor-social/por-local").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ---------- US3: mensal + filtro ----------

    @Test
    void mensalRetornaSerieCronologica() throws Exception {
        Ponto p = ponto(local("Escola", false));
        coleta(p, "6", LocalDate.of(2026, 6, 15));
        coleta(p, "4", LocalDate.of(2026, 7, 10));
        coleta(p, "8", LocalDate.of(2026, 7, 20));

        mockMvc.perform(get("/api/impacto/valor-social/mensal").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].competencia").value("2026-06"))
                .andExpect(jsonPath("$[0].valorSocial").value(closeTo(6.0, 0.0001)))
                .andExpect(jsonPath("$[1].competencia").value("2026-07"))
                .andExpect(jsonPath("$[1].valorSocial").value(closeTo(12.0, 0.0001)));
    }

    @Test
    void filtroPorIntervaloRestringeOTotal() throws Exception {
        Ponto p = ponto(local("Escola", false));
        coleta(p, "6", LocalDate.of(2026, 6, 15));
        coleta(p, "12", LocalDate.of(2026, 7, 10));

        mockMvc.perform(get("/api/impacto/valor-social").with(user("gestor"))
                        .param("de", "2026-07-01").param("ate", "2026-07-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorSocial").value(closeTo(12.0, 0.0001)));
    }
}
