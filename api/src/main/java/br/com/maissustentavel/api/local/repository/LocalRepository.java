package br.com.maissustentavel.api.local.repository;

import br.com.maissustentavel.api.local.domain.Local;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repositório de {@link Local}. A listagem padrão usa {@link #findByArquivadoFalse()}
 * (só ativos); a visão de arquivados usa {@link #findByArquivadoTrue()}.
 */
public interface LocalRepository extends JpaRepository<Local, UUID> {

    List<Local> findByArquivadoFalse();

    List<Local> findByArquivadoTrue();
}
