package br.com.maissustentavel.api.acesso.bootstrap;

import br.com.maissustentavel.api.acesso.domain.Papel;
import br.com.maissustentavel.api.acesso.domain.Usuario;
import br.com.maissustentavel.api.acesso.repository.PapelRepository;
import br.com.maissustentavel.api.acesso.repository.UsuarioRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cria o Gestor inicial a partir de variáveis de ambiente (SEED_GESTOR_EMAIL / SEED_GESTOR_SENHA),
 * de forma idempotente. Sem as variáveis, não faz nada. Nenhuma credencial é versionada (Art. 7.4,
 * research D4).
 */
@Component
public class GestorSeeder implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PapelRepository papelRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    public GestorSeeder(UsuarioRepository usuarioRepository, PapelRepository papelRepository,
                        PasswordEncoder passwordEncoder, Environment environment) {
        this.usuarioRepository = usuarioRepository;
        this.papelRepository = papelRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = environment.getProperty("SEED_GESTOR_EMAIL");
        String senha = environment.getProperty("SEED_GESTOR_SENHA");
        if (email == null || email.isBlank() || senha == null || senha.isBlank()) {
            return; // sem variáveis de ambiente, nada a semear
        }
        if (usuarioRepository.existsByEmail(email)) {
            return; // idempotente: já existe
        }
        Papel gestor = papelRepository.findByNome("Gestor")
                .orElseThrow(() -> new IllegalStateException("Papel 'Gestor' ausente — verifique a migração V2"));
        Usuario usuario = new Usuario();
        usuario.setNome("Gestor");
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuario.getPapeis().add(gestor);
        usuarioRepository.save(usuario);
    }
}
