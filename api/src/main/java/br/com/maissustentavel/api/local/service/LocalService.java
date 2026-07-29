package br.com.maissustentavel.api.local.service;

import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.local.web.dto.LocalRequest;
import br.com.maissustentavel.api.local.web.dto.LocalResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regras de cadastro de Local: criar, editar, listar e o soft delete
 * (arquivar/reativar). Nunca remove fisicamente (RN-G-06).
 */
@Service
public class LocalService {

    private final LocalRepository repositorio;

    public LocalService(LocalRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Transactional
    public LocalResponse criar(LocalRequest requisicao) {
        Local local = new Local();
        aplicar(local, requisicao);
        // saveAndFlush: descarrega o INSERT já dentro da transação para que o
        // @Generated recarregue criado_em (senão a resposta viria com data nula).
        return toResponse(repositorio.saveAndFlush(local));
    }

    @Transactional(readOnly = true)
    public List<LocalResponse> listar(boolean arquivados) {
        List<Local> locais = arquivados
                ? repositorio.findByArquivadoTrue()
                : repositorio.findByArquivadoFalse();
        return locais.stream().map(LocalService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public LocalResponse detalhar(UUID id) {
        return toResponse(buscar(id));
    }

    @Transactional
    public LocalResponse editar(UUID id, LocalRequest requisicao) {
        Local local = buscar(id);
        aplicar(local, requisicao);
        return toResponse(repositorio.save(local));
    }

    @Transactional
    public LocalResponse arquivar(UUID id) {
        Local local = buscar(id);
        local.setArquivado(true); // idempotente: já arquivado permanece arquivado
        return toResponse(repositorio.save(local));
    }

    @Transactional
    public LocalResponse reativar(UUID id) {
        Local local = buscar(id);
        local.setArquivado(false); // idempotente: já ativo permanece ativo
        return toResponse(repositorio.save(local));
    }

    private Local buscar(UUID id) {
        return repositorio.findById(id).orElseThrow(() -> new LocalNaoEncontradoException(id));
    }

    private static void aplicar(Local local, LocalRequest requisicao) {
        local.setNome(requisicao.nome().trim());
        local.setEndereco(requisicao.endereco().trim());
        local.setTipo(requisicao.tipo());
    }

    private static LocalResponse toResponse(Local local) {
        return new LocalResponse(
                local.getId(),
                local.getNome(),
                local.getTipo(),
                local.getEndereco(),
                local.isArquivado(),
                local.getCriadoEm());
    }
}
