package br.com.maissustentavel.api.auth.service;

import br.com.maissustentavel.api.auth.domain.Usuario;
import br.com.maissustentavel.api.auth.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Carrega o usuário por e-mail para a autenticação do Spring Security.
 * Mensagem genérica na ausência (FR-007: não enumerar usuários).
 */
@Service
public class UsuarioDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas"));
        List<SimpleGrantedAuthority> autoridades = usuario.getPapeis().stream()
                .map(papel -> new SimpleGrantedAuthority("ROLE_" + papel.getNome()))
                .toList();
        return User.withUsername(usuario.getEmail())
                .password(usuario.getSenhaHash())
                .authorities(autoridades)
                .build();
    }
}
