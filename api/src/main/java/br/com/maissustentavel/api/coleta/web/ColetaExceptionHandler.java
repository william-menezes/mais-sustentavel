package br.com.maissustentavel.api.coleta.web;

import br.com.maissustentavel.api.coleta.service.PontoIndisponivelException;
import br.com.maissustentavel.api.local.web.dto.ErroResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Ponto arquivado ao registrar coleta → 409 (sem vazar detalhes). Reutiliza
 * {@link ErroResponse}. (Ponto inexistente → 404 é tratado no handler de Ponto.)
 */
@RestControllerAdvice
public class ColetaExceptionHandler {

    @ExceptionHandler(PontoIndisponivelException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErroResponse pontoIndisponivel(PontoIndisponivelException excecao) {
        return new ErroResponse("Ponto arquivado não recebe novas coletas");
    }
}
