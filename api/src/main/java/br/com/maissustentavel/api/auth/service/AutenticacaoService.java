package br.com.maissustentavel.api.auth.service;

import br.com.maissustentavel.api.auth.domain.Papel;
import br.com.maissustentavel.api.auth.domain.Usuario;
import br.com.maissustentavel.api.auth.repository.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Camada de serviço da autenticação: delega ao {@link AuthenticationManager} (que compara a
 * senha via BCrypt) e monta os dados públicos do usuário. Lança {@code AuthenticationException}
 * em falha — o controller traduz para resposta genérica (FR-007).
 */
@Service
public class AutenticacaoService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;

    public AutenticacaoService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public ResultadoAutenticacao autenticar(String email, String senha) {
        Authentication authentication = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(email, senha));
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow();
        Set<String> papeis = usuario.getPapeis().stream().map(Papel::getNome).collect(Collectors.toSet());
        return new ResultadoAutenticacao(authentication, usuario.getNome(), papeis);
    }
}
