package br.com.maissustentavel.api.impacto.web;

import br.com.maissustentavel.api.impacto.service.ImpactoService;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialLocalResponse;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialMensalResponse;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * API de impacto / valor social (IS-01). Somente leitura; exige sessão autenticada
 * (401 sem sessão). Filtro de período opcional {@code ?de=&ate=} (ISO, inclusivo).
 * Contrato: contracts/impacto.md.
 */
@RestController
public class ImpactoController {

    private final ImpactoService servico;

    public ImpactoController(ImpactoService servico) {
        this.servico = servico;
    }

    @GetMapping("/api/impacto/valor-social")
    public ValorSocialResponse total(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return servico.total(de, ate);
    }

    @GetMapping("/api/impacto/valor-social/por-local")
    public List<ValorSocialLocalResponse> porLocal(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return servico.porLocal(de, ate);
    }

    @GetMapping("/api/impacto/valor-social/mensal")
    public List<ValorSocialMensalResponse> mensal(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return servico.mensal(de, ate);
    }
}
