package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.LocalFixture;
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
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integração REST de Ponto: cadastro com referência obrigatória, edição da referência, QR,
 * soft delete, 400/401/404/409. Usa o gerador de QR real (imagem PNG de verdade).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class PontoControllerTest {

    private static final String PATIO = "pátio";
    private static final String PATIO_COBERTO = "pátio coberto";
    private static final String CAMPO_REFERENCIA = "$.campos.referencia";

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
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        l.setArquivado(arquivado);
        return localRepository.saveAndFlush(l).getId();
    }

    private String criarPonto(UUID localId) throws Exception {
        return criarPonto(localId, PontoFixture.REFERENCIA);
    }

    /** O cadastro passa a exigir corpo (contrato da 007), então o helper sempre envia um. */
    private String criarPonto(UUID localId, String referencia) throws Exception {
        return JsonPath.read(cadastrarComSucesso(localId, referencia), "$.id");
    }

    /** Corpo da resposta do cadastro, para quem precisa de mais que o {@code id}. */
    private String cadastrarComSucesso(UUID localId, String referencia) throws Exception {
        return cadastrar(localId, PontoFixture.json(referencia))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    private ResultActions cadastrar(UUID localId, String corpo) throws Exception {
        return mockMvc.perform(post("/api/locais/" + localId + "/pontos")
                .with(user("gestor")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private ResultActions editar(String id, String corpo) throws Exception {
        return mockMvc.perform(put("/api/pontos/" + id)
                .with(user("gestor")).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    // ---------- US1: cadastrar + listar ----------

    @Test
    void cadastrarRetorna201ComLocationReferenciaEQr() throws Exception {
        UUID localId = local(false);
        cadastrar(localId, PontoFixture.json(PATIO))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/pontos/")))
                .andExpect(jsonPath("$.localId").value(localId.toString()))
                .andExpect(jsonPath("$.referencia").value(PATIO))
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

    // ---------- visão geral: coleção global ----------

    @Test
    void listarTodosRetornaEstacoesDeLocaisDiferentesComONomeDoLocal() throws Exception {
        // A coleção global é a operação que a visão geral precisa e que não existia (FR-001).
        criarPonto(local(false));
        Local outro = new Local();
        outro.setNome("Outro local");
        LocalFixture.comEnderecoValido(outro);
        outro.setTipo(TipoLocal.EMPRESA);
        criarPonto(localRepository.saveAndFlush(outro).getId());

        mockMvc.perform(get("/api/pontos").with(user("gestor")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].localNome").value(containsInAnyOrder("Ativo", "Outro local")));
    }

    @Test
    void listarTodosTrazSoAtivosPorPadrao() throws Exception {
        String id = criarPonto(local(false));
        mockMvc.perform(post("/api/pontos/" + id + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/pontos").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/pontos").param("arquivados", "true").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void listarTodosSemSessaoRetorna401() throws Exception {
        mockMvc.perform(get("/api/pontos"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadastrarEmLocalInexistenteRetorna404() throws Exception {
        cadastrar(UUID.randomUUID(), PontoFixture.json(PontoFixture.REFERENCIA))
                .andExpect(status().isNotFound());
    }

    @Test
    void cadastrarEmLocalArquivadoRetorna409() throws Exception {
        UUID arquivado = local(true);
        cadastrar(arquivado, PontoFixture.json(PontoFixture.REFERENCIA))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(containsString("arquivado")));
    }

    // ---------- US2: referência obrigatória no cadastro ----------

    @Test
    void cadastrarSemCorpoRetorna400() throws Exception {
        // A porta que criava estação anônima: antes desta feature o POST não recebia corpo (FR-011).
        UUID localId = local(false);

        mockMvc.perform(post("/api/locais/" + localId + "/pontos").with(user("gestor")).with(csrf()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/locais/" + localId + "/pontos").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void cadastrarComReferenciaVaziaRetorna400ComOMapaCampos() throws Exception {
        cadastrar(local(false), PontoFixture.json(""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(CAMPO_REFERENCIA).exists());
    }

    @Test
    void cadastrarComReferenciaSoComEspacosRetorna400ENaoCriaEstacaoAnonima() throws Exception {
        // "   " é recusado, nunca normalizado para nulo: a coluna aceita nulo para o acervo anterior
        // à V7, então converter furaria a obrigatoriedade por dentro (contracts/pontos.md).
        UUID localId = local(false);

        cadastrar(localId, PontoFixture.json("   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(CAMPO_REFERENCIA).exists());
        mockMvc.perform(get("/api/locais/" + localId + "/pontos").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void cadastrarComReferenciaAcimaDe60Retorna400ComOMapaCampos() throws Exception {
        cadastrar(local(false), PontoFixture.json("x".repeat(61)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(CAMPO_REFERENCIA).exists());
    }

    @Test
    void cadastrarComReferenciaDe60RetornaCriado() throws Exception {
        // A borda do limite tem de passar; 60 é "no máximo", não "menos de" (FR-017).
        cadastrar(local(false), PontoFixture.json("x".repeat(60)))
                .andExpect(status().isCreated());
    }

    @Test
    void cadastrarDescartaEspacosEmVoltaDaReferencia() throws Exception {
        cadastrar(local(false), PontoFixture.json("  pátio  "))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.referencia").value(PATIO));
    }

    @Test
    void cadastrarSemSessaoRetorna401() throws Exception {
        UUID localId = local(false);
        mockMvc.perform(post("/api/locais/" + localId + "/pontos").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PontoFixture.json(PontoFixture.REFERENCIA)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void duasEstacoesNoMesmoLocalRecebemQrsDistintos() throws Exception {
        // FR-026 continua valendo: o caminho de cadastro mudou de forma nesta feature, e a garantia
        // do QR único não pode sair de graça junto com a mudança.
        UUID localId = local(false);

        String primeiro = JsonPath.read(cadastrarComSucesso(localId, PATIO), "$.qrConteudo");
        String segundo = JsonPath.read(cadastrarComSucesso(localId, "cantina"), "$.qrConteudo");

        assertNotEquals(primeiro, segundo);
    }

    // ---------- US2: editar a referência ----------

    @Test
    void editarAlteraAReferenciaERetorna200() throws Exception {
        String id = criarPonto(local(false), PATIO);

        editar(id, PontoFixture.json(PATIO_COBERTO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referencia").value(PATIO_COBERTO));
    }

    @Test
    void editarEstacaoInexistenteRetorna404() throws Exception {
        editar(UUID.randomUUID().toString(), PontoFixture.json(PATIO_COBERTO))
                .andExpect(status().isNotFound());
    }

    @Test
    void editarComReferenciaSoComEspacosRetorna400ComOMapaCampos() throws Exception {
        String id = criarPonto(local(false), PATIO);

        editar(id, PontoFixture.json("   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(CAMPO_REFERENCIA).exists());
    }

    @Test
    void editarComReferenciaAcimaDe60Retorna400() throws Exception {
        String id = criarPonto(local(false));

        editar(id, PontoFixture.json("x".repeat(61)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath(CAMPO_REFERENCIA).exists());
    }

    @Test
    void editarIgnoraLocalIdNoCorpoEMantemAEstacaoNoMesmoLocal() throws Exception {
        // RN-G-05: o QR colado na parede aponta para uma estação que o morador associa àquele
        // endereço, e mover reescreveria o histórico de coletas de dois locais — inclusive valor
        // social já publicado. O corpo não tem esse campo, e enviá-lo à força não muda nada.
        UUID origem = local(false);
        Local destino = new Local();
        destino.setNome("Destino");
        LocalFixture.comEnderecoValido(destino);
        destino.setTipo(TipoLocal.EMPRESA);
        UUID destinoId = localRepository.saveAndFlush(destino).getId();
        String id = criarPonto(origem, PATIO);

        editar(id, """
                {"referencia":"%s","localId":"%s"}
                """.formatted(PATIO_COBERTO, destinoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.localId").value(origem.toString()));

        mockMvc.perform(get("/api/locais/" + destinoId + "/pontos").with(user("gestor")))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void editarNaoAlteraOQrConteudo() throws Exception {
        // Um QR novo invalidaria o adesivo já impresso e colado.
        UUID localId = local(false);
        String criado = cadastrarComSucesso(localId, PATIO);
        String id = JsonPath.read(criado, "$.id");
        String antes = JsonPath.read(criado, "$.qrConteudo");

        editar(id, PontoFixture.json(PATIO_COBERTO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrConteudo").value(antes));

        mockMvc.perform(get("/api/locais/" + localId + "/pontos").with(user("gestor")))
                .andExpect(jsonPath("$[0].qrConteudo").value(antes));
    }

    @Test
    void editarEstacaoArquivadaCorrigeAReferenciaSemReativar() throws Exception {
        // Corrigir o rótulo de um registro histórico não o devolve à operação (RN-G-06).
        String id = criarPonto(local(false), PATIO);
        mockMvc.perform(post("/api/pontos/" + id + "/arquivar").with(user("gestor")).with(csrf()))
                .andExpect(status().isOk());

        editar(id, PontoFixture.json(PATIO_COBERTO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referencia").value(PATIO_COBERTO))
                .andExpect(jsonPath("$.arquivado").value(true));
    }

    @Test
    void editarSemSessaoRetorna401() throws Exception {
        String id = criarPonto(local(false));

        mockMvc.perform(put("/api/pontos/" + id).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PontoFixture.json(PATIO_COBERTO)))
                .andExpect(status().isUnauthorized());
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
