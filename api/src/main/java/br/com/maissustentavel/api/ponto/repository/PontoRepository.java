package br.com.maissustentavel.api.ponto.repository;

import br.com.maissustentavel.api.ponto.domain.Ponto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório de {@link Ponto}. Listagem por Local, separando ativos de arquivados.
 */
public interface PontoRepository extends JpaRepository<Ponto, UUID> {

    List<Ponto> findByLocal_IdAndArquivadoFalse(UUID localId);

    List<Ponto> findByLocal_IdAndArquivadoTrue(UUID localId);
}
