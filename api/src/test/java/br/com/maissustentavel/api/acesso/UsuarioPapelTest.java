package br.com.maissustentavel.api.acesso;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.acesso.domain.Papel;
import br.com.maissustentavel.api.acesso.domain.Usuario;
import br.com.maissustentavel.api.acesso.repository.PapelRepository;
import br.com.maissustentavel.api.acesso.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * US1 — vínculo N:N: um usuário acumula papéis; e-mail é único.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class UsuarioPapelTest {

    @Autowired
    UsuarioRepository usuarioRepository;
    @Autowired
    PapelRepository papelRepository;
    @Autowired
    EntityManager em;

    @Test
    void usuarioAcumulaVariosPapeis() {
        Papel gestor = papelRepository.findByNome("Gestor").orElseThrow();
        Papel coletor = papelRepository.findByNome("Coletor").orElseThrow();

        Usuario u = new Usuario();
        u.setNome("Fulano de Tal");
        u.setEmail("fulano@exemplo.com");
        u.setSenhaHash("hash-de-teste");
        u.getPapeis().add(gestor);
        u.getPapeis().add(coletor);
        usuarioRepository.saveAndFlush(u);

        em.clear(); // descarta o cache p/ recarregar do banco e provar que o vínculo persistiu

        Usuario recarregado = usuarioRepository.findById(u.getId()).orElseThrow();
        assertEquals(2, recarregado.getPapeis().size(), "usuário deve acumular os 2 papéis (N:N)");
    }

    @Test
    void emailDuplicadoEhRejeitado() {
        usuarioRepository.saveAndFlush(novoUsuario("dup@exemplo.com"));
        assertThrows(DataIntegrityViolationException.class,
                () -> usuarioRepository.saveAndFlush(novoUsuario("dup@exemplo.com")));
    }

    private Usuario novoUsuario(String email) {
        Usuario u = new Usuario();
        u.setNome("Beltrano");
        u.setEmail(email);
        u.setSenhaHash("hash-de-teste");
        return u;
    }
}
