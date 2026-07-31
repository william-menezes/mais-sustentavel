package br.com.maissustentavel.api;

import br.com.maissustentavel.api.auth.service.LimitadorTentativasLogin;
import br.com.maissustentavel.api.local.LocalFixture;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Endurecimento de autenticação (CA-01, Phase 2b): CSRF nas escritas + endpoint de
 * priming do token. FR-014.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
// Contexto fresco: a config de CSRF (spa/cookie) é sensível ao cache de contexto
// compartilhado da suíte; isolada, ela resolve corretamente para o CookieCsrfTokenRepository.
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SecurityCsrfTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    LimitadorTentativasLogin limitador;

    @BeforeEach
    void limpar() {
        limitador.limpar();
    }

    @Test
    void escritaSemTokenCsrfRetorna403() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@teste.com\",\"senha\":\"y\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void escritaComTokenCsrfPassaDaProtecao() throws Exception {
        // Com token válido o CSRF deixa passar; credenciais inexistentes → 401 (não 403).
        mockMvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"naoexiste@teste.com\",\"senha\":\"y\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void escritaAutenticadaComCookieMasSemHeaderRetorna403() throws Exception {
        // Reproduz o cenário observado ao vivo: sessão autenticada + cookie XSRF-TOKEN
        // presente, mas SEM o header X-XSRF-TOKEN. O double-submit DEVE rejeitar (403).
        mockMvc.perform(post("/api/locais").with(user("gestor"))
                        .cookie(new Cookie("XSRF-TOKEN", "token-qualquer"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LocalFixture.json("X", "OUTRO")))
                .andExpect(status().isForbidden());
    }

    @Test
    void endpointCsrfEhPublicoEEmiteCookie() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }
}
