package br.com.maissustentavel.api.acesso.web;

import br.com.maissustentavel.api.acesso.service.AutenticacaoService;
import br.com.maissustentavel.api.acesso.service.ResultadoAutenticacao;
import br.com.maissustentavel.api.acesso.web.dto.ErroResponse;
import br.com.maissustentavel.api.acesso.web.dto.LoginRequest;
import br.com.maissustentavel.api.acesso.web.dto.LoginResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Autenticação por e-mail e senha, com sessão por cookie.
 * Erros de credencial retornam mensagem genérica (FR-007, anti-enumeração).
 */
@RestController
@RequestMapping("/api/auth")
public class AutenticacaoController {

    private final AutenticacaoService autenticacaoService;
    private final SecurityContextRepository securityContextRepository;

    public AutenticacaoController(AutenticacaoService autenticacaoService,
                                  SecurityContextRepository securityContextRepository) {
        this.autenticacaoService = autenticacaoService;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest requisicao,
                                   HttpServletRequest request, HttpServletResponse response) {
        try {
            ResultadoAutenticacao resultado = autenticacaoService.autenticar(requisicao.email(), requisicao.senha());
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(resultado.authentication());
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);
            return ResponseEntity.ok(new LoginResponse(resultado.nome(), resultado.papeis()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErroResponse("Credenciais inválidas"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
