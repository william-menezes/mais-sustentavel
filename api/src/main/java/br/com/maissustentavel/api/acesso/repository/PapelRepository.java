package br.com.maissustentavel.api.acesso.repository;

import br.com.maissustentavel.api.acesso.domain.Papel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PapelRepository extends JpaRepository<Papel, UUID> {

    Optional<Papel> findByNome(String nome);
}
