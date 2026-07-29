package br.com.maissustentavel.api.auth.web;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint público para o SPA semear o cookie {@code XSRF-TOKEN} antes do 1º POST
 * (inclusive o login). O CsrfCookieFilter garante a emissão do cookie; este GET dá
 * ao frontend um ponto explícito para obtê-lo. Ver research D8.
 */
@RestController
@RequestMapping("/api/auth")
public class CsrfController {

    @GetMapping("/csrf")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }
}
