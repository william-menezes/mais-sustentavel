package br.com.maissustentavel.api.coleta.domain;

import br.com.maissustentavel.api.auth.domain.Usuario;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Registro de uma coleta física (medição real de litros) num {@link Ponto} — N:1 (RN-G-01/12).
 * Imutável após criada (append-only): não há edição/remoção nem soft delete.
 */
@Entity
@Table(name = "coleta")
public class Coleta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ponto_id", nullable = false)
    private Ponto ponto;

    @Column(name = "litros_reais", nullable = false)
    private BigDecimal litrosReais;

    @Column(nullable = false)
    private LocalDate data;

    // Quem registrou (auditoria). Opcional — preparado para o papel Coletor (AC-03).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coletor_id")
    private Usuario coletor;

    @Generated(event = EventType.INSERT)
    @Column(name = "criado_em", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime criadoEm;

    public UUID getId() {
        return id;
    }

    public Ponto getPonto() {
        return ponto;
    }

    public void setPonto(Ponto ponto) {
        this.ponto = ponto;
    }

    public BigDecimal getLitrosReais() {
        return litrosReais;
    }

    public void setLitrosReais(BigDecimal litrosReais) {
        this.litrosReais = litrosReais;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public Usuario getColetor() {
        return coletor;
    }

    public void setColetor(Usuario coletor) {
        this.coletor = coletor;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
