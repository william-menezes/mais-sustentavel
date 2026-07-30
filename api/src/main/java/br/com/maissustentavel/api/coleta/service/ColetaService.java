package br.com.maissustentavel.api.coleta.service;

import br.com.maissustentavel.api.auth.domain.Usuario;
import br.com.maissustentavel.api.auth.repository.UsuarioRepository;
import br.com.maissustentavel.api.coleta.domain.Coleta;
import br.com.maissustentavel.api.coleta.repository.ColetaRepository;
import br.com.maissustentavel.api.coleta.web.dto.ColetaRequest;
import br.com.maissustentavel.api.coleta.web.dto.ColetaResponse;
import br.com.maissustentavel.api.coleta.web.dto.ColetasDoPontoResponse;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import br.com.maissustentavel.api.ponto.service.PontoNaoEncontradoException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Regras de Coleta: registrar (em ponto ativo, com litros/data válidos e coletor
 * opcional) e consultar coletas + total de litros de um ponto. Coleta é imutável.
 */
@Service
public class ColetaService {

    private final ColetaRepository coletaRepository;
    private final PontoRepository pontoRepository;
    private final UsuarioRepository usuarioRepository;

    public ColetaService(ColetaRepository coletaRepository,
                         PontoRepository pontoRepository,
                         UsuarioRepository usuarioRepository) {
        this.coletaRepository = coletaRepository;
        this.pontoRepository = pontoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public ColetaResponse registrar(UUID pontoId, ColetaRequest requisicao, String coletorEmail) {
        Ponto ponto = pontoRepository.findById(pontoId)
                .orElseThrow(() -> new PontoNaoEncontradoException(pontoId));
        if (ponto.isArquivado()) {
            throw new PontoIndisponivelException(pontoId);
        }
        Usuario coletor = coletorEmail == null ? null
                : usuarioRepository.findByEmail(coletorEmail).orElse(null);

        Coleta coleta = new Coleta();
        coleta.setPonto(ponto);
        coleta.setLitrosReais(requisicao.litrosReais());
        coleta.setData(requisicao.data());
        coleta.setColetor(coletor);
        return toResponse(coletaRepository.saveAndFlush(coleta));
    }

    @Transactional(readOnly = true)
    public ColetasDoPontoResponse listarDoPonto(UUID pontoId) {
        List<ColetaResponse> coletas = coletaRepository.findByPonto_IdOrderByDataDesc(pontoId)
                .stream().map(ColetaService::toResponse).toList();
        return new ColetasDoPontoResponse(coletaRepository.somarLitrosPorPonto(pontoId), coletas);
    }

    private static ColetaResponse toResponse(Coleta coleta) {
        return new ColetaResponse(
                coleta.getId(),
                coleta.getPonto().getId(),
                coleta.getLitrosReais(),
                coleta.getData(),
                coleta.getColetor() == null ? null : coleta.getColetor().getNome(),
                coleta.getCriadoEm());
    }
}
