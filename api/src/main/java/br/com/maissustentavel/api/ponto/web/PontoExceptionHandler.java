package br.com.maissustentavel.api.ponto.web;

import br.com.maissustentavel.api.local.web.dto.ErroResponse;
import br.com.maissustentavel.api.ponto.service.LocalNaoDisponivelException;
import br.com.maissustentavel.api.ponto.service.PontoNaoEncontradoException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduz as exceções de Ponto em respostas limpas (sem vazar detalhes — FR-013):
 * Ponto inexistente → 404; Local arquivado → 409. Reutiliza {@link ErroResponse}.
 */
@RestControllerAdvice
public class PontoExceptionHandler {

    @ExceptionHandler(PontoNaoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErroResponse naoEncontrado(PontoNaoEncontradoException excecao) {
        return new ErroResponse("Ponto não encontrado");
    }

    @ExceptionHandler(LocalNaoDisponivelException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErroResponse localIndisponivel(LocalNaoDisponivelException excecao) {
        return new ErroResponse("Local arquivado não aceita novos pontos");
    }
}
