package br.com.maissustentavel.api.local.web;

import br.com.maissustentavel.api.local.service.LocalNaoEncontradoException;
import br.com.maissustentavel.api.local.web.dto.ErroResponse;
import br.com.maissustentavel.api.local.web.dto.ValidacaoErroResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduz exceções em respostas limpas em pt-BR, sem vazar stacktrace/SQL/detalhes
 * internos (FR-012 / Art. 7.6): 404 para Local inexistente, 400 para validação.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LocalNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErroResponse naoEncontrado(LocalNaoEncontradoException excecao) {
        return new ErroResponse("Local não encontrado");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidacaoErroResponse validacao(MethodArgumentNotValidException excecao) {
        Map<String, String> campos = new LinkedHashMap<>();
        for (FieldError erro : excecao.getBindingResult().getFieldErrors()) {
            campos.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        }
        return new ValidacaoErroResponse("Dados inválidos", campos);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErroResponse ilegivel(HttpMessageNotReadableException excecao) {
        // Ex.: JSON malformado ou tipo fora da lista fechada (enum inválido).
        return new ErroResponse("Dados inválidos");
    }
}
