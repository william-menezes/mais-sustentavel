package br.com.maissustentavel.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Força a materialização do token CSRF em cada requisição, garantindo que o cookie
 * {@code XSRF-TOKEN} seja emitido mesmo com o carregamento diferido do Spring Security
 * (padrão SPA — ver research D8).
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            csrfToken.getToken(); // dispara o saveToken → grava o cookie
        }
        filterChain.doFilter(request, response);
    }
}
