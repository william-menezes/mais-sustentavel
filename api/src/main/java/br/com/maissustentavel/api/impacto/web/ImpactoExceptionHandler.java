package br.com.maissustentavel.api.impacto.web;

import br.com.maissustentavel.api.impacto.service.PeriodoInvalidoException;
import br.com.maissustentavel.api.local.web.dto.ErroResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Traduz erros das consultas de impacto em respostas limpas em pt-BR (Art. 7.6):
 * período inconsistente → 400 "Período inválido"; parâmetro de data em formato
 * inválido (type mismatch) → 400 "Dados inválidos". Escopo restrito ao ImpactoController.
 */
@RestControllerAdvice(assignableTypes = ImpactoController.class)
public class ImpactoExceptionHandler {

    @ExceptionHandler(PeriodoInvalidoException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErroResponse periodoInvalido(PeriodoInvalidoException excecao) {
        return new ErroResponse("Período inválido");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErroResponse parametroInvalido(MethodArgumentTypeMismatchException excecao) {
        // Ex.: ?de=abc (data fora do formato ISO). Sem vazar detalhes internos.
        return new ErroResponse("Dados inválidos");
    }
}
