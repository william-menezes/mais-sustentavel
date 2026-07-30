package br.com.maissustentavel.api.impacto.service;

import br.com.maissustentavel.api.impacto.repository.ImpactoRepository;
import br.com.maissustentavel.api.impacto.repository.LocalAgregado;
import br.com.maissustentavel.api.impacto.repository.MensalAgregado;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialLocalResponse;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialMensalResponse;
import br.com.maissustentavel.api.impacto.web.dto.ValorSocialResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Valor social (IS-01): converte litros reais das coletas em reais à razão de
 * R$ 1,00/litro (RN-G-02) e agrega em três recortes (total, por local, mensal),
 * com filtro de período opcional. Somente leitura; não altera estado.
 */
@Service
public class ImpactoService {

    /** Taxa de conversão do domínio: R$ 1,00 por litro real (RN-G-02). */
    static final BigDecimal TAXA = BigDecimal.ONE;

    private final ImpactoRepository repositorio;

    public ImpactoService(ImpactoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Transactional(readOnly = true)
    public ValorSocialResponse total(LocalDate de, LocalDate ate) {
        validarPeriodo(de, ate);
        BigDecimal litros = repositorio.somarLitros(de, ate);
        return new ValorSocialResponse(litros, valorSocial(litros));
    }

    @Transactional(readOnly = true)
    public List<ValorSocialLocalResponse> porLocal(LocalDate de, LocalDate ate) {
        validarPeriodo(de, ate);
        return repositorio.agregarPorLocal(de, ate).stream()
                .map(this::toLocalResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ValorSocialMensalResponse> mensal(LocalDate de, LocalDate ate) {
        validarPeriodo(de, ate);
        return repositorio.agregarMensal(de, ate).stream()
                .map(this::toMensalResponse)
                .toList();
    }

    private void validarPeriodo(LocalDate de, LocalDate ate) {
        if (de != null && ate != null && de.isAfter(ate)) {
            throw new PeriodoInvalidoException();
        }
    }

    private ValorSocialLocalResponse toLocalResponse(LocalAgregado a) {
        return new ValorSocialLocalResponse(a.getLocalId(), a.getLocalNome(),
                a.getLitros(), valorSocial(a.getLitros()));
    }

    private ValorSocialMensalResponse toMensalResponse(MensalAgregado a) {
        String competencia = String.format("%04d-%02d", a.getAno(), a.getMes());
        return new ValorSocialMensalResponse(competencia, a.getLitros(), valorSocial(a.getLitros()));
    }

    private static BigDecimal valorSocial(BigDecimal litros) {
        return litros.multiply(TAXA).setScale(2, RoundingMode.HALF_UP);
    }
}
