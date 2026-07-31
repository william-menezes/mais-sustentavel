package br.com.maissustentavel.api.ponto.service;

import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.local.service.LocalNaoEncontradoException;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import br.com.maissustentavel.api.ponto.web.dto.PontoResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regras de Ponto: cadastrar (em Local ativo, com QR gerado de forma atômica), listar
 * por local, recuperar a imagem do QR e o soft delete (arquivar/reativar).
 */
@Service
public class PontoService {

    private final PontoRepository pontoRepository;
    private final LocalRepository localRepository;
    private final GeradorQrCode geradorQrCode;
    private final String baseUrl;

    @PersistenceContext
    private EntityManager entityManager;

    public PontoService(PontoRepository pontoRepository,
                        LocalRepository localRepository,
                        GeradorQrCode geradorQrCode,
                        @Value("${app.ponto.base-url}") String baseUrl) {
        this.pontoRepository = pontoRepository;
        this.localRepository = localRepository;
        this.geradorQrCode = geradorQrCode;
        this.baseUrl = baseUrl;
    }

    @Transactional
    public PontoResponse criar(UUID localId) {
        Local local = localRepository.findById(localId)
                .orElseThrow(() -> new LocalNaoEncontradoException(localId));
        if (local.isArquivado()) {
            throw new LocalNaoDisponivelException(localId);
        }

        UUID id = UUID.randomUUID();
        String conteudo = montarConteudo(id);
        geradorQrCode.gerarPng(conteudo); // valida a geração; falha => rollback (FR-004)

        Ponto ponto = new Ponto();
        ponto.setId(id);
        ponto.setLocal(local);
        ponto.setQrConteudo(conteudo);
        // id atribuído pela aplicação: usa persist (não merge) e flush para recarregar criadoEm.
        entityManager.persist(ponto);
        entityManager.flush();
        return toResponse(ponto);
    }

    @Transactional(readOnly = true)
    public List<PontoResponse> listar(UUID localId, boolean arquivados) {
        List<Ponto> pontos = arquivados
                ? pontoRepository.findByLocal_IdAndArquivadoTrue(localId)
                : pontoRepository.findByLocal_IdAndArquivadoFalse(localId);
        return pontos.stream().map(PontoService::toResponse).toList();
    }

    /**
     * Estações de todos os locais, para a visão geral.
     *
     * <p>Delega a uma consulta com {@code join fetch} porque a resposta carrega o **nome** do local em
     * cada linha: com a associação LAZY, mapear a lista dispararia uma consulta por estação.
     */
    @Transactional(readOnly = true)
    public List<PontoResponse> listarTodos(boolean arquivados) {
        return pontoRepository.buscarTodos(arquivados).stream().map(PontoService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public byte[] imagemQr(UUID id) {
        Ponto ponto = buscar(id);
        return geradorQrCode.gerarPng(ponto.getQrConteudo());
    }

    @Transactional
    public PontoResponse arquivar(UUID id) {
        Ponto ponto = buscar(id);
        ponto.setArquivado(true); // idempotente
        return toResponse(pontoRepository.save(ponto));
    }

    @Transactional
    public PontoResponse reativar(UUID id) {
        Ponto ponto = buscar(id);
        ponto.setArquivado(false); // idempotente
        return toResponse(pontoRepository.save(ponto));
    }

    private Ponto buscar(UUID id) {
        return pontoRepository.findById(id).orElseThrow(() -> new PontoNaoEncontradoException(id));
    }

    private String montarConteudo(UUID id) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return base + "/p/" + id;
    }

    private static PontoResponse toResponse(Ponto ponto) {
        return new PontoResponse(
                ponto.getId(),
                ponto.getLocal().getId(),
                ponto.getLocal().getNome(),
                ponto.getReferencia(),
                ponto.getQrConteudo(),
                "/api/pontos/" + ponto.getId() + "/qr",
                ponto.isArquivado(),
                ponto.getCriadoEm());
    }
}
