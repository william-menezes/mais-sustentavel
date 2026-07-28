package br.com.maissustentavel.api.auth.repository;

import br.com.maissustentavel.api.auth.domain.Papel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PapelRepository extends JpaRepository<Papel, UUID> {

    Optional<Papel> findByNome(String nome);
}
