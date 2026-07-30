package br.com.maissustentavel.api.impacto.repository;

import br.com.maissustentavel.api.coleta.domain.Coleta;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Consultas de agregação de valor social (IS-01), sobre {@link Coleta} → Ponto → Local.
 * Somente leitura; filtro de período opcional e inclusivo ({@code de}/{@code ate} nuláveis).
 * Não filtra por arquivamento de local/ponto — coletas de entidades arquivadas contam (RN-G-06).
 */
public interface ImpactoRepository extends Repository<Coleta, UUID> {

    /**
     * Soma total de litros reais no período (0 quando não há coletas).
     * O filtro usa {@code coalesce(:param, c.data)} em vez de {@code :param is null or ...}
     * para que o PostgreSQL infira o tipo do parâmetro (o {@code is null} isolado não dá contexto).
     */
    @Query("""
            select coalesce(sum(c.litrosReais), 0)
            from Coleta c
            where c.data >= coalesce(:de, c.data) and c.data <= coalesce(:ate, c.data)
            """)
    BigDecimal somarLitros(@Param("de") LocalDate de, @Param("ate") LocalDate ate);

    /**
     * Litros por local no período. Parte de Local com LEFT JOIN até Coleta (filtro de data
     * no ON, para preservar linhas-zero): locais ativos aparecem mesmo sem coletas; locais
     * arquivados só aparecem quando têm coletas (RN-G-06). Ordenado por nome.
     */
    @Query("""
            select l.id as localId, l.nome as localNome, coalesce(sum(c.litrosReais), 0) as litros
            from Local l
            left join Ponto p on p.local = l
            left join Coleta c on c.ponto = p
                and c.data >= coalesce(:de, c.data) and c.data <= coalesce(:ate, c.data)
            group by l.id, l.nome, l.arquivado
            having l.arquivado = false or coalesce(sum(c.litrosReais), 0) > 0
            order by l.nome
            """)
    List<LocalAgregado> agregarPorLocal(@Param("de") LocalDate de, @Param("ate") LocalDate ate);

    /** Litros por ano-mês no período, em ordem cronológica. */
    @Query("""
            select year(c.data) as ano, month(c.data) as mes, coalesce(sum(c.litrosReais), 0) as litros
            from Coleta c
            where c.data >= coalesce(:de, c.data) and c.data <= coalesce(:ate, c.data)
            group by year(c.data), month(c.data)
            order by year(c.data), month(c.data)
            """)
    List<MensalAgregado> agregarMensal(@Param("de") LocalDate de, @Param("ate") LocalDate ate);
}
