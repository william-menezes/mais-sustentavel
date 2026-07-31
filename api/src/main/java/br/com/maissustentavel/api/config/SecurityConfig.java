package br.com.maissustentavel.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

/**
 * Configuração de segurança (AC-01).
 *
 * <p>Público: health do Actuator e os endpoints de autenticação (`/api/auth/**`).
 * O restante exige autenticação. A identidade vem do {@code UsuarioDetailsService} + BCrypt.
 * CSRF habilitado no padrão SPA (cookie XSRF-TOKEN + header X-XSRF-TOKEN, double-submit) e
 * CORS restrito a origens conhecidas — endurecimento introduzido na CA-01 (research D8/D9).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                // CSRF no padrão SPA (Spring Security 7): CookieCsrfTokenRepository (XSRF-TOKEN,
                // X-XSRF-TOKEN) + handler que resolve o token do header. O CsrfCookieFilter
                // garante a emissão do cookie mesmo com carregamento diferido (research D8).
                .csrf(csrf -> csrf.spa())
                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/logout", "/api/auth/csrf").permitAll()
                        .anyRequest().authenticated())
                // 401 puro, sem cabeçalho WWW-Authenticate. Com httpBasic ativo, o
                // BasicAuthenticationEntryPoint respondia `WWW-Authenticate: Basic`, e o
                // navegador abria o diálogo nativo de usuário/senha por cima do SPA sempre
                // que uma chamada caía em 401 (sessão ausente ou expirada). O único cliente
                // desta API é o SPA, que se autentica por sessão em cookie: Basic não tem
                // uso aqui, e o 401 limpo é o que o autenticacaoErroInterceptor espera para
                // redirecionar ao login.
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}
