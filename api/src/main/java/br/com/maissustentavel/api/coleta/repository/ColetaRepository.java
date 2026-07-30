package br.com.maissustentavel.api.coleta.repository;

import br.com.maissustentavel.api.coleta.domain.Coleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Repositório de {@link Coleta}: coletas de um ponto (mais recentes primeiro) e o
 * total de litros do ponto.
 */
public interface ColetaRepository extends JpaRepository<Coleta, UUID> {

    List<Coleta> findByPonto_IdOrderByDataDesc(UUID pontoId);

    @Query("select coalesce(sum(c.litrosReais), 0) from Coleta c where c.ponto.id = :pontoId")
    BigDecimal somarLitrosPorPonto(@Param("pontoId") UUID pontoId);
}
