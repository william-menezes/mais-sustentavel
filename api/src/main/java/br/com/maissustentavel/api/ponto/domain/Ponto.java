package br.com.maissustentavel.api.ponto.domain;

import br.com.maissustentavel.api.local.domain.Local;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Ponto de coleta (estação física) dentro de um {@link Local} — relação N:1 (RN-G-05).
 * Cada ponto tem um QR Code único (o conteúdo é uma URL do app; ver PontoService).
 * Usa exclusão lógica ({@code arquivado}) — RN-G-06.
 *
 * <p>O {@code id} é atribuído pela aplicação (não {@code @GeneratedValue}) para compor
 * o conteúdo do QR antes de persistir.
 */
@Entity
@Table(name = "ponto")
public class Ponto {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "local_id", nullable = false)
    private Local local;

    @Column(name = "qr_conteudo", nullable = false, unique = true)
    private String qrConteudo;

    @Column(nullable = false)
    private boolean arquivado = false;

    @Generated(event = EventType.INSERT)
    @Column(name = "criado_em", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime criadoEm;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Local getLocal() {
        return local;
    }

    public void setLocal(Local local) {
        this.local = local;
    }

    public String getQrConteudo() {
        return qrConteudo;
    }

    public void setQrConteudo(String qrConteudo) {
        this.qrConteudo = qrConteudo;
    }

    public boolean isArquivado() {
        return arquivado;
    }

    public void setArquivado(boolean arquivado) {
        this.arquivado = arquivado;
    }

    public OffsetDateTime getCriadoEm() {
        return criadoEm;
    }
}
