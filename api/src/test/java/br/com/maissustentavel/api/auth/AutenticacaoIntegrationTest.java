package br.com.maissustentavel.api.auth;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.auth.domain.Papel;
import br.com.maissustentavel.api.auth.domain.Usuario;
import br.com.maissustentavel.api.auth.repository.PapelRepository;
import br.com.maissustentavel.api.auth.repository.UsuarioRepository;
import br.com.maissustentavel.api.auth.service.LimitadorTentativasLogin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US2 — login do Gestor: credenciais corretas autenticam; incorretas e conta
 * inexistente retornam a MESMA resposta genérica (anti-enumeração, FR-007); logout.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AutenticacaoIntegrationTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    UsuarioRepository usuarioRepository;
    @Autowired
    PapelRepository papelRepository;
    @Autowired
    PasswordEncoder passwordEncoder;
    @Autowired
    LimitadorTentativasLogin limitador;

    @BeforeEach
    void prepararCadaTeste() {
        usuarioRepository.deleteAll();
        limitador.limpar();
    }

    private void criarGestor(String email, String senha) {
        Papel gestor = papelRepository.findByNome("Gestor").orElseThrow();
        Usuario u = new Usuario();
        u.setNome("Gestor de Teste");
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode(senha));
        u.getPapeis().add(gestor);
        usuarioRepository.save(u);
    }

    @Test
    void loginValidoAutenticaComPapel() throws Exception {
        criarGestor("gestor@teste.com", "segredo123");
        mockMvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"gestor@teste.com\",\"senha\":\"segredo123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Gestor de Teste"))
                .andExpect(jsonPath("$.papeis[0]").value("Gestor"));
    }

    @Test
    void loginSenhaIncorretaRetornaErroGenerico() throws Exception {
        criarGestor("gestor@teste.com", "segredo123");
        mockMvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"gestor@teste.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value("Credenciais inválidas"));
    }

    @Test
    void loginContaInexistenteRetornaMesmaResposta() throws Exception {
        mockMvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"naoexiste@teste.com\",\"senha\":\"qualquer\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.erro").value("Credenciais inválidas"));
    }

    @Test
    void logoutRetorna204() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void excessoDeTentativasRetorna429() throws Exception {
        String corpo = "{\"email\":\"x@teste.com\",\"senha\":\"errada\"}";
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().is(429));
    }
}
