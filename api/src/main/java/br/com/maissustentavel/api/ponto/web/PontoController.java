package br.com.maissustentavel.api.ponto.web;

import br.com.maissustentavel.api.ponto.service.PontoService;
import br.com.maissustentavel.api.ponto.web.dto.PontoResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * API de Ponto. Criar/listar são aninhados no Local; operações de item são flat.
 * Todos os endpoints exigem sessão autenticada; escritas exigem token CSRF.
 * Contrato: contracts/pontos.md.
 */
@RestController
public class PontoController {

    private final PontoService servico;

    public PontoController(PontoService servico) {
        this.servico = servico;
    }

    @PostMapping("/api/locais/{localId}/pontos")
    public ResponseEntity<PontoResponse> cadastrar(@PathVariable UUID localId) {
        PontoResponse criado = servico.criar(localId);
        return ResponseEntity.created(URI.create("/api/pontos/" + criado.id())).body(criado);
    }

    @GetMapping("/api/locais/{localId}/pontos")
    public List<PontoResponse> listar(@PathVariable UUID localId,
                                      @RequestParam(name = "arquivados", defaultValue = "false") boolean arquivados) {
        return servico.listar(localId, arquivados);
    }

    /**
     * Coleção global, para a visão geral de Pontos de coleta. Sem paginação: a operação tem dezenas de
     * estações e a filtragem acontece no cliente, como na visão geral de Locais.
     */
    @GetMapping("/api/pontos")
    public List<PontoResponse> listarTodos(
            @RequestParam(name = "arquivados", defaultValue = "false") boolean arquivados) {
        return servico.listarTodos(arquivados);
    }

    @GetMapping(value = "/api/pontos/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public byte[] qr(@PathVariable UUID id) {
        return servico.imagemQr(id);
    }

    @PostMapping("/api/pontos/{id}/arquivar")
    public PontoResponse arquivar(@PathVariable UUID id) {
        return servico.arquivar(id);
    }

    @PostMapping("/api/pontos/{id}/reativar")
    public PontoResponse reativar(@PathVariable UUID id) {
        return servico.reativar(id);
    }
}
