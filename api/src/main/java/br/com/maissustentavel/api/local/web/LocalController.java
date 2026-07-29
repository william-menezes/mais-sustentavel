package br.com.maissustentavel.api.local.web;

import br.com.maissustentavel.api.local.service.LocalService;
import br.com.maissustentavel.api.local.web.dto.LocalRequest;
import br.com.maissustentavel.api.local.web.dto.LocalResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * API de Local. Todos os endpoints exigem sessão autenticada (Gestor no MVP).
 * As escritas exigem token CSRF (ver SecurityConfig). Contrato: contracts/locais.md.
 */
@RestController
@RequestMapping("/api/locais")
public class LocalController {

    private final LocalService servico;

    public LocalController(LocalService servico) {
        this.servico = servico;
    }

    @PostMapping
    public ResponseEntity<LocalResponse> cadastrar(@Valid @RequestBody LocalRequest requisicao) {
        LocalResponse criado = servico.criar(requisicao);
        return ResponseEntity.created(URI.create("/api/locais/" + criado.id())).body(criado);
    }

    @GetMapping
    public List<LocalResponse> listar(@RequestParam(name = "arquivados", defaultValue = "false") boolean arquivados) {
        return servico.listar(arquivados);
    }

    @GetMapping("/{id}")
    public LocalResponse detalhar(@PathVariable UUID id) {
        return servico.detalhar(id);
    }

    @PutMapping("/{id}")
    public LocalResponse editar(@PathVariable UUID id, @Valid @RequestBody LocalRequest requisicao) {
        return servico.editar(id, requisicao);
    }

    @PostMapping("/{id}/arquivar")
    public LocalResponse arquivar(@PathVariable UUID id) {
        return servico.arquivar(id);
    }

    @PostMapping("/{id}/reativar")
    public LocalResponse reativar(@PathVariable UUID id) {
        return servico.reativar(id);
    }
}
