package br.com.maissustentavel.api.local;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.repository.LocalRepository;
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

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integração REST de /api/locais: cadastro/listagem (US1), arquivar (US2),
 * editar/reativar (US3), validação, 401 sem sessão e 404.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class LocalControllerTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    LocalRepository repositorio;

    @BeforeEach
    void limpar() {
        repositorio.deleteAll();
    }

    // ---------- US1: cadastrar + listar ----------

    @Test
    void cadastrarRetorna201ComLocation() throws Exception {
        mockMvc.perform(post("/api/locais").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Escola A\",\"endereco\":\"Rua X, 1\",\"tipo\":\"ESCOLA\"}"))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/locais/")))
                .andExpect(jsonPath("$.nome").value("Escola A"))
                .andExpect(jsonPath("$.tipo").value("ESCOLA"))
                .andExpect(jsonPath("$.arquivado").value(false));
    }

    @Test
    void cadastrarSemNomeRetorna400ComCampo() throws Exception {
        mockMvc.perform(post("/api/locais").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"   \",\"endereco\":\"Rua X, 1\",\"tipo\":\"ESCOLA\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists());
    }

    @Test
    void cadastrarTipoInvalidoRetorna400() throws Exception {
        mockMvc.perform(post("/api/locais").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"A\",\"endereco\":\"Rua X, 1\",\"tipo\":\"CASTELO\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarRetornaAtivos() throws Exception {
        criarLocal("Ativo", "ESCOLA");
        mockMvc.perform(get("/api/locais").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nome").value("Ativo"));
    }

    @Test
    void listarSemSessaoRetorna401() throws Exception {
        mockMvc.perform(get("/api/locais"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- US2: arquivar ----------

    @Test
    void arquivarRemoveDosAtivosEEhIdempotente() throws Exception {
        String id = criarLocal("X", "EMPRESA");

        mockMvc.perform(post("/api/locais/" + id + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(true));
        // idempotente: arquivar de novo continua 200 e arquivado
        mockMvc.perform(post("/api/locais/" + id + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(true));

        mockMvc.perform(get("/api/locais").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/locais").param("arquivados", "true").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void arquivarInexistenteRetorna404() throws Exception {
        mockMvc.perform(post("/api/locais/" + UUID.randomUUID() + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Local não encontrado"));
    }

    // ---------- US3: editar + reativar ----------

    @Test
    void editarAtualizaRetorna200() throws Exception {
        String id = criarLocal("Antigo", "ESCOLA");
        mockMvc.perform(put("/api/locais/" + id).with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Novo\",\"endereco\":\"Rua Y, 2\",\"tipo\":\"EMPRESA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Novo"))
                .andExpect(jsonPath("$.tipo").value("EMPRESA"));
    }

    @Test
    void editarInvalidoRetorna400() throws Exception {
        String id = criarLocal("Antigo", "ESCOLA");
        mockMvc.perform(put("/api/locais/" + id).with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"\",\"endereco\":\"Rua Y, 2\",\"tipo\":\"EMPRESA\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void editarInexistenteRetorna404() throws Exception {
        mockMvc.perform(put("/api/locais/" + UUID.randomUUID()).with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"X\",\"endereco\":\"Rua Y\",\"tipo\":\"OUTRO\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void reativarVoltaParaAtivos() throws Exception {
        String id = criarLocal("X", "EMPRESA");
        mockMvc.perform(post("/api/locais/" + id + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/locais/" + id + "/reativar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(false));
        mockMvc.perform(get("/api/locais").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(1));
    }

    /** Cria um local via API e devolve o id gerado. */
    private String criarLocal(String nome, String tipo) throws Exception {
        String corpo = "{\"nome\":\"" + nome + "\",\"endereco\":\"Rua X, 1\",\"tipo\":\"" + tipo + "\"}";
        String json = mockMvc.perform(post("/api/locais").with(user("gestor")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }
}
