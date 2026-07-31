package br.com.maissustentavel.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
    void naoDesafiaComBasicAuth() throws Exception {
        // Regressão: com httpBasic ativo, o 401 vinha com `WWW-Authenticate: Basic` e o
        // navegador abria o diálogo nativo de usuário/senha por cima do SPA a cada chamada
        // sem sessão. O SPA autentica por cookie; o 401 deve vir limpo, para o
        // autenticacaoErroInterceptor redirecionar ao login.
        mockMvc.perform(get("/qualquer-recurso-protegido"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"));
    }
}