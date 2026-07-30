package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integração REST de Ponto: cadastro (US1), QR (US2), soft delete (US3), 401/404/409.
 * Usa o gerador de QR real (imagem PNG de verdade).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class PontoControllerTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    LocalRepository localRepository;
    @Autowired
    PontoRepository pontoRepository;

    @BeforeEach
    void limpar() {
        pontoRepository.deleteAll();
        localRepository.deleteAll();
    }

    private UUID local(boolean arquivado) {
        Local l = new Local();
        l.setNome(arquivado ? "Arquivado" : "Ativo");
        l.setEndereco("Rua X, 1");
        l.setTipo(TipoLocal.ESCOLA);
        l.setArquivado(arquivado);
        return localRepository.saveAndFlush(l).getId();
    }

    private String criarPonto(UUID localId) throws Exception {
        String json = mockMvc.perform(post("/api/locais/" + localId + "/pontos").with(user("gestor")).with(csrf()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }

    // ---------- US1: cadastrar + listar ----------

    @Test
    void cadastrarRetorna201ComLocationEQr() throws Exception {
        UUID localId = local(false);
        mockMvc.perform(post("/api/locais/" + localId + "/pontos").with(user("gestor")).with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/pontos/")))
                .andExpect(jsonPath("$.localId").value(localId.toString()))
                .andExpect(jsonPath("$.arquivado").value(false))
                .andExpect(jsonPath("$.qrConteudo").value(containsString("/p/")))
                .andExpect(jsonPath("$.qrImagemUrl").value(containsString("/qr")));
    }

    @Test
    void listarRetornaAtivosDoLocal() throws Exception {
        UUID localId = local(false);
        criarPonto(localId);
        mockMvc.perform(get("/api/locais/" + localId + "/pontos").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void listarSemSessaoRetorna401() throws Exception {
        UUID localId = local(false);
        mockMvc.perform(get("/api/locais/" + localId + "/pontos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadastrarEmLocalInexistenteRetorna404() throws Exception {
        mockMvc.perform(post("/api/locais/" + UUID.randomUUID() + "/pontos").with(user("gestor")).with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void cadastrarEmLocalArquivadoRetorna409() throws Exception {
        UUID arquivado = local(true);
        mockMvc.perform(post("/api/locais/" + arquivado + "/pontos").with(user("gestor")).with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(containsString("arquivado")));
    }

    // ---------- US2: recuperar QR ----------

    @Test
    void qrRetornaImagemPng() throws Exception {
        UUID localId = local(false);
        String id = criarPonto(localId);
        byte[] png = mockMvc.perform(get("/api/pontos/" + id + "/qr").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andReturn().getResponse().getContentAsByteArray();
        org.junit.jupiter.api.Assertions.assertTrue(png.length > 0);
        org.junit.jupiter.api.Assertions.assertEquals((byte) 0x89, png[0]);
    }

    @Test
    void qrDePontoInexistenteRetorna404() throws Exception {
        mockMvc.perform(get("/api/pontos/" + UUID.randomUUID() + "/qr").with(user("gestor")))
                .andExpect(status().isNotFound());
    }

    // ---------- US3: arquivar / reativar ----------

    @Test
    void arquivarEReativarPonto() throws Exception {
        UUID localId = local(false);
        String id = criarPonto(localId);

        mockMvc.perform(post("/api/pontos/" + id + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(true));
        mockMvc.perform(get("/api/locais/" + localId + "/pontos").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/locais/" + localId + "/pontos").param("arquivados", "true").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(post("/api/pontos/" + id + "/reativar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(false));
    }

    @Test
    void arquivarInexistenteRetorna404() throws Exception {
        mockMvc.perform(post("/api/pontos/" + UUID.randomUUID() + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isNotFound());
    }
}
