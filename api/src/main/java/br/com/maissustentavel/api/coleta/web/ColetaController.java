package br.com.maissustentavel.api.coleta.web;

import br.com.maissustentavel.api.coleta.service.ColetaService;
import br.com.maissustentavel.api.coleta.web.dto.ColetaRequest;
import br.com.maissustentavel.api.coleta.web.dto.ColetaResponse;
import br.com.maissustentavel.api.coleta.web.dto.ColetasDoPontoResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

/**
 * API de Coleta, aninhada no Ponto. Todos os endpoints exigem sessão autenticada;
 * a escrita exige token CSRF. "Quem registrou" vem do usuário autenticado.
 * Contrato: contracts/coletas.md.
 */
@RestController
public class ColetaController {

    private final ColetaService servico;

    public ColetaController(ColetaService servico) {
        this.servico = servico;
    }

    @PostMapping("/api/pontos/{pontoId}/coletas")
    public ResponseEntity<ColetaResponse> registrar(@PathVariable UUID pontoId,
                                                    @Valid @RequestBody ColetaRequest requisicao,
                                                    Authentication autenticacao) {
        String coletorEmail = autenticacao == null ? null : autenticacao.getName();
        ColetaResponse criada = servico.registrar(pontoId, requisicao, coletorEmail);
        return ResponseEntity.created(URI.create("/api/coletas/" + criada.id())).body(criada);
    }

    @GetMapping("/api/pontos/{pontoId}/coletas")
    public ColetasDoPontoResponse listar(@PathVariable UUID pontoId) {
        return servico.listarDoPonto(pontoId);
    }
}
