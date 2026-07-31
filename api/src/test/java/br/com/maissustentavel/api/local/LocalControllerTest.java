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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.nullValue;
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
 * Integração REST de /api/locais com endereço estruturado: cadastro/listagem (US1),
 * arquivar (US2), editar/reativar (US3), validação por componente, 401 sem sessão e 404.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class LocalControllerTest {

    private static final String LOCAIS = "/api/locais";
    private static final String GESTOR = "gestor";
    private static final String ESCOLA = "ESCOLA";
    private static final String EMPRESA = "EMPRESA";
    private static final String ESCOLA_A = "Escola A";
    private static final String CAMPO_NUMERO = "$.numero";

    @Autowired
    MockMvc mockMvc;
    @Autowired
    LocalRepository repositorio;

    @BeforeEach
    void limpar() {
        repositorio.deleteAll();
    }

    // ---------- US1: cadastrar com endereço estruturado ----------

    @Test
    void cadastrarRetorna201ComLocationEOsComponentesDoEndereco() throws Exception {
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LocalFixture.json(ESCOLA_A, ESCOLA)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith(LOCAIS + "/")))
                .andExpect(jsonPath("$.nome").value(ESCOLA_A))
                .andExpect(jsonPath("$.tipo").value(ESCOLA))
                .andExpect(jsonPath("$.cep").value(LocalFixture.CEP))
                .andExpect(jsonPath("$.rua").value(LocalFixture.RUA))
                .andExpect(jsonPath(CAMPO_NUMERO).value(LocalFixture.NUMERO))
                .andExpect(jsonPath("$.bairro").value(LocalFixture.BAIRRO))
                .andExpect(jsonPath("$.cidade").value(LocalFixture.CIDADE))
                .andExpect(jsonPath("$.uf").value("MG"))
                .andExpect(jsonPath("$.arquivado").value(false));
    }

    @Test
    void cadastrarSemComplementoRetorna201() throws Exception {
        // O complemento é o único componente opcional (FR-002). O corpo da fixture não o inclui.
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LocalFixture.json("Sem complemento", ESCOLA)))
                .andExpect(status().isCreated())
                // O contrato promete a chave presente com nulo, não a chave ausente — por isso
                // nullValue() e não doesNotExist(), que passaria ou falharia conforme a
                // configuração de serialização de nulos.
                .andExpect(jsonPath("$.complemento").value(nullValue()));
    }

    @Test
    void cadastrarComNumeroNaoNumericoRetorna201() throws Exception {
        // FR-006: "s/n" e sufixos alfabéticos são registros legítimos.
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCom("Praça Central", "ESPACO_PUBLICO", "numero", "s/n")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath(CAMPO_NUMERO).value("s/n"));

        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCom("Condomínio B", "CONDOMINIO", "numero", "120A")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath(CAMPO_NUMERO).value("120A"));
    }

    @Test
    void cadastrarSemNomeRetorna400ComCampo() throws Exception {
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(campos("   ", ESCOLA))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists());
    }

    @Test
    void cadastrarComComponenteObrigatorioEmBrancoRetorna400() throws Exception {
        // Espaços em branco contam como ausência — caso de borda declarado na spec.
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCom(ESCOLA_A, ESCOLA, "bairro", "   ")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.bairro").exists());
    }

    @Test
    void cadastrarComCepForaDeOitoDigitosRetorna400() throws Exception {
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCom(ESCOLA_A, ESCOLA, "cep", "123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.cep").exists());
    }

    @Test
    void cadastrarComUfInvalidaRetorna400() throws Exception {
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpoCom(ESCOLA_A, ESCOLA, "uf", "XX")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cadastrarTipoInvalidoRetorna400() throws Exception {
        mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LocalFixture.json("A", "CASTELO")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarRetornaAtivos() throws Exception {
        criarLocal("Ativo", ESCOLA);
        mockMvc.perform(get(LOCAIS).with(user(GESTOR)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nome").value("Ativo"));
    }

    @Test
    void listarSemSessaoRetorna401() throws Exception {
        mockMvc.perform(get(LOCAIS))
                .andExpect(status().isUnauthorized());
    }

    // ---------- US2: arquivar ----------

    @Test
    void arquivarRemoveDosAtivosEEhIdempotente() throws Exception {
        String id = criarLocal("X", EMPRESA);

        mockMvc.perform(post(LOCAIS + "/" + id + "/arquivar").with(user(GESTOR)).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(true));
        // idempotente: arquivar de novo continua 200 e arquivado
        mockMvc.perform(post(LOCAIS + "/" + id + "/arquivar").with(user(GESTOR)).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(true));

        mockMvc.perform(get(LOCAIS).with(user(GESTOR)))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get(LOCAIS).param("arquivados", "true").with(user(GESTOR)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void arquivarInexistenteRetorna404() throws Exception {
        mockMvc.perform(post(LOCAIS + "/" + UUID.randomUUID() + "/arquivar").with(user(GESTOR)).with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.erro").value("Local não encontrado"));
    }

    // ---------- US3: editar + reativar ----------

    @Test
    void editarAtualizaRetorna200() throws Exception {
        String id = criarLocal("Antigo", ESCOLA);

        Map<String, String> novos = campos("Novo", EMPRESA);
        novos.put("cep", "01310930");
        novos.put("rua", "Avenida Paulista");
        novos.put("numero", "1578");
        novos.put("bairro", "Bela Vista");
        novos.put("cidade", "São Paulo");
        novos.put("uf", "SP");

        mockMvc.perform(put(LOCAIS + "/" + id).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(novos)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Novo"))
                .andExpect(jsonPath("$.tipo").value(EMPRESA))
                .andExpect(jsonPath("$.cidade").value("São Paulo"))
                .andExpect(jsonPath("$.uf").value("SP"));
    }

    @Test
    void editarInvalidoRetorna400() throws Exception {
        String id = criarLocal("Antigo", ESCOLA);
        mockMvc.perform(put(LOCAIS + "/" + id).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(campos("", EMPRESA))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void editarInexistenteRetorna404() throws Exception {
        mockMvc.perform(put(LOCAIS + "/" + UUID.randomUUID()).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LocalFixture.json("X", "OUTRO")))
                .andExpect(status().isNotFound());
    }

    @Test
    void reativarVoltaParaAtivos() throws Exception {
        String id = criarLocal("X", EMPRESA);
        mockMvc.perform(post(LOCAIS + "/" + id + "/arquivar").with(user(GESTOR)).with(csrf()))
                .andExpect(status().isOk());
        mockMvc.perform(post(LOCAIS + "/" + id + "/reativar").with(user(GESTOR)).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.arquivado").value(false));
        mockMvc.perform(get(LOCAIS).with(user(GESTOR)))
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * Componentes válidos de um LocalRequest, para o teste sobrescrever pelo nome o que quer
     * inválido. Evita um helper de oito parâmetros posicionais, onde trocar bairro por cidade
     * passaria despercebido e o teste passaria pelo motivo errado.
     */
    private Map<String, String> campos(String nome, String tipo) {
        Map<String, String> campos = new LinkedHashMap<>();
        campos.put("nome", nome);
        campos.put("tipo", tipo);
        campos.put("cep", LocalFixture.CEP);
        campos.put("rua", LocalFixture.RUA);
        campos.put("numero", LocalFixture.NUMERO);
        campos.put("bairro", LocalFixture.BAIRRO);
        campos.put("cidade", LocalFixture.CIDADE);
        campos.put("uf", LocalFixture.UF.name());
        return campos;
    }

    /** Serializa os componentes como corpo JSON (sem complemento — é opcional). */
    private String corpo(Map<String, String> campos) {
        return campos.entrySet().stream()
                .map(campo -> "\"%s\":\"%s\"".formatted(campo.getKey(), campo.getValue()))
                .collect(Collectors.joining(",", "{", "}"));
    }

    /** Atalho: corpo válido com um único componente substituído. */
    private String corpoCom(String nome, String tipo, String campo, String valor) {
        Map<String, String> campos = campos(nome, tipo);
        campos.put(campo, valor);
        return corpo(campos);
    }

    /** Cria um local via API e devolve o id gerado. */
    private String criarLocal(String nome, String tipo) throws Exception {
        String json = mockMvc.perform(post(LOCAIS).with(user(GESTOR)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(LocalFixture.json(nome, tipo)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }
}
