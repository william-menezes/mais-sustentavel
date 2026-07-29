package br.com.maissustentavel.api.auth;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.auth.domain.Papel;
import br.com.maissustentavel.api.auth.repository.PapelRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * US1 — os quatro papéis existem após a migração e só o Gestor está ativo no MVP.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PapelRepositoryTest {

    @Autowired
    PapelRepository papelRepository;

    @Test
    void seedContemOsQuatroPapeis() {
        Set<String> nomes = papelRepository.findAll().stream()
                .map(Papel::getNome)
                .collect(Collectors.toSet());
        assertEquals(Set.of("Gestor", "Responsável", "Coletor", "Doador"), nomes);
    }

    @Test
    void apenasGestorEstaAtivoNoMvp() {
        assertTrue(papelRepository.findByNome("Gestor").orElseThrow().isAtivo());
        assertFalse(papelRepository.findByNome("Responsável").orElseThrow().isAtivo());
        assertFalse(papelRepository.findByNome("Coletor").orElseThrow().isAtivo());
        assertFalse(papelRepository.findByNome("Doador").orElseThrow().isAtivo());
    }
}