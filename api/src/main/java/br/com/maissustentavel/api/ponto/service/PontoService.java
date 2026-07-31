package br.com.maissustentavel.api.ponto.service;

import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.local.service.LocalNaoEncontradoException;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import br.com.maissustentavel.api.ponto.web.dto.PontoRequest;
import br.com.maissustentavel.api.ponto.web.dto.PontoResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regras de Ponto: cadastrar (em Local ativo, com referência e QR gerado de forma atômica),
 * corrigir a referência, listar por local e no geral, recuperar a imagem do QR e o soft delete
 * (arquivar/reativar).
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
    public PontoResponse criar(UUID localId, PontoRequest requisicao) {
        String referencia = normalizar(requisicao.referencia());
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
        ponto.setReferencia(referencia);
        ponto.setQrConteudo(conteudo);
        // id atribuído pela aplicação: usa persist (não merge) e flush para recarregar criadoEm.
        entityManager.persist(ponto);
        entityManager.flush();
        return toResponse(ponto);
    }

    /**
     * Corrige a referência de uma estação — o único campo editável dela.
     *
     * <p>Não recebe local: a RN-G-05 mantém o ponto vinculado ao local, e o QR já colado na parede
     * aponta para uma estação que o morador associa àquele endereço. Não toca no {@code qrConteudo}:
     * um QR novo invalidaria o adesivo já impresso. Não olha {@code arquivado}: corrigir o rótulo de
     * um registro histórico não o reativa (RN-G-06).
     */
    @Transactional
    public PontoResponse editar(UUID id, PontoRequest requisicao) {
        String referencia = normalizar(requisicao.referencia());
        Ponto ponto = buscar(id);
        ponto.setReferencia(referencia);
        return toResponse(pontoRepository.save(ponto));
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

    /**
     * Descarta os espaços das pontas (FR-016) e recusa o que sobrar vazio.
     *
     * <p>Recusar, e não converter, é a razão de existir deste método: {@code @NotBlank} no
     * {@code PontoRequest} já barra {@code "   "}
     * com 400 em quem entra pela API, e esta guarda garante que nenhum outro chamador consiga
     * transformar espaços em {@code null}. A coluna aceita nulo para o acervo anterior à V7, então um
     * nulo vindo de cadastro novo seria uma estação anônima passando por legado (research D4).
     */
    private static String normalizar(String referencia) {
        String limpa = referencia == null ? "" : referencia.trim();
        if (limpa.isEmpty()) {
            throw new IllegalArgumentException("referência não pode ser vazia");
        }
        return limpa;
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
