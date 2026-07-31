package br.com.maissustentavel.api.ponto.repository;

import br.com.maissustentavel.api.ponto.domain.Ponto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * Repositório de {@link Ponto}. Listagem por Local e listagem global, sempre separando ativos de
 * arquivados (RN-G-06).
 */
public interface PontoRepository extends JpaRepository<Ponto, UUID> {

    List<Ponto> findByLocal_IdAndArquivadoFalse(UUID localId);

    List<Ponto> findByLocal_IdAndArquivadoTrue(UUID localId);

    /**
     * Estações de todos os locais, para a visão geral.
     *
     * <p>O {@code join fetch} não é otimização opcional: a associação com Local é LAZY, e a lista
     * exibe "Local · referência" em cada linha. Sem ele, ler o nome do local dispararia uma consulta
     * por estação.
     *
     * <p>A ordenação agrupa estações do mesmo local e, dentro do grupo, ordena pela referência.
     * {@code nulls last} coloca as estações ainda sem referência ao fim do **grupo do seu local** —
     * não ao fim da lista, o que as afastaria do local a que pertencem.
     */
    @Query("""
            select p from Ponto p
            join fetch p.local l
            where p.arquivado = :arquivado
            order by l.nome asc, p.referencia asc nulls last
            """)
    List<Ponto> buscarTodos(@Param("arquivado") boolean arquivado);
}
