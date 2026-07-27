package br.com.maissustentavel.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuração de segurança MÍNIMA da fundação.
 *
 * <p>Libera apenas os endpoints de saúde do Actuator (necessário para o health check
 * da Render — ver docs/deploy.md) e exige autenticação para o resto. A autenticação
 * de verdade (login, papéis, RLS) é responsabilidade da história AC-01.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    /**
     * Sem usuários por enquanto: substitui o usuário padrão que o Spring Boot geraria
     * (com senha aleatória impressa no log, imprópria para produção). A autenticação
     * real (usuários, papéis, RLS) é implementada em AC-01.
     */
    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager();
    }
}