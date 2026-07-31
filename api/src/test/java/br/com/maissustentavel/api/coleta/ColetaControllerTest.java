package br.com.maissustentavel.api.coleta;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.coleta.repository.ColetaRepository;
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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integração REST de Coleta: registrar (US1), listar+total (US2), validação e 401/404/409.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Transactional
class ColetaControllerTest {

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

    private UUID ponto(boolean arquivado) {
        Local l = new Local();
        l.setNome("Local");
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        localRepository.saveAndFlush(l);
        Ponto p = new Ponto();
        p.setId(UUID.randomUUID());
        p.setLocal(l);
        p.setQrConteudo("http://localhost:4200/p/" + p.getId());
        p.setArquivado(arquivado);
        pontoRepository.saveAndFlush(p);
        return p.getId();
    }

    private String corpo(String litros, LocalDate data) {
        return "{\"litrosReais\":" + litros + ",\"data\":\"" + data + "\"}";
    }

    private void registrarViaApi(UUID pontoId, String litros, LocalDate data) throws Exception {
        mockMvc.perform(post("/api/pontos/" + pontoId + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo(litros, data)))
                .andExpect(status().isCreated());
    }

    // ---------- US1: registrar ----------

    @Test
    void registrarRetorna201() throws Exception {
        UUID pontoId = ponto(false);
        mockMvc.perform(post("/api/pontos/" + pontoId + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("12.5", LocalDate.now().minusDays(1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pontoId").value(pontoId.toString()))
                .andExpect(jsonPath("$.litrosReais").value(closeTo(12.5, 0.0001)));
    }

    @Test
    void litrosZeroRetorna400() throws Exception {
        UUID pontoId = ponto(false);
        mockMvc.perform(post("/api/pontos/" + pontoId + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("0", LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void litrosNegativoRetorna400() throws Exception {
        UUID pontoId = ponto(false);
        mockMvc.perform(post("/api/pontos/" + pontoId + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("-5", LocalDate.now().minusDays(1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dataFuturaRetorna400() throws Exception {
        UUID pontoId = ponto(false);
        mockMvc.perform(post("/api/pontos/" + pontoId + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("5", LocalDate.now().plusDays(1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void pontoInexistenteRetorna404() throws Exception {
        mockMvc.perform(post("/api/pontos/" + UUID.randomUUID() + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("5", LocalDate.now().minusDays(1))))
                .andExpect(status().isNotFound());
    }

    @Test
    void pontoArquivadoRetorna409() throws Exception {
        UUID arquivado = ponto(true);
        mockMvc.perform(post("/api/pontos/" + arquivado + "/coletas").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo("5", LocalDate.now().minusDays(1))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(containsString("arquivado")));
    }

    @Test
    void listarSemSessaoRetorna401() throws Exception {
        UUID pontoId = ponto(false);
        mockMvc.perform(get("/api/pontos/" + pontoId + "/coletas"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- US2: listar + total ----------

    @Test
    void listarRetornaTotalEColetas() throws Exception {
        UUID pontoId = ponto(false);
        registrarViaApi(pontoId, "10", LocalDate.now().minusDays(2));
        registrarViaApi(pontoId, "5.5", LocalDate.now().minusDays(1));

        mockMvc.perform(get("/api/pontos/" + pontoId + "/coletas").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalLitros").value(closeTo(15.5, 0.0001)))
                .andExpect(jsonPath("$.coletas.length()").value(2));
    }
}
