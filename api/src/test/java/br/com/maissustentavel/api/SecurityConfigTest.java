package br.com.maissustentavel.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SecurityConfigTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void protectedEndpointRequiresAuth() throws Exception {
        mockMvc.perform(get("/qualquer-recurso-protegido")).andExpect(status().isUnauthorized());
    }

    @Test
    void noDefaultUserGrantsAccess() throws Exception {
        // Nenhum usuário padrão deve existir: credenciais básicas quaisquer não autenticam.
        mockMvc.perform(get("/qualquer-recurso-protegido").with(httpBasic("user", "qualquer-senha")))
                .andExpect(status().isUnauthorized());
    }
}