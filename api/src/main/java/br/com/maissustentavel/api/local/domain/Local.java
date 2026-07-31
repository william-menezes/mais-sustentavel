package br.com.maissustentavel.api.local.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Local (instituição atendida) da operação. Usa exclusão lógica: {@code arquivado}
 * remove das listas ativas sem apagar o registro (RN-G-06 / Art. 2.6).
 *
 * <p>O endereço é decomposto em componentes (CEP, rua, número, complemento, bairro, cidade e UF).
 * As colunas são nullable no banco por causa dos registros migrados do modelo antigo, mas a
 * obrigatoriedade é garantida na fronteira da API — só o complemento é realmente opcional.
 *
 * <p>A coluna {@code endereco_legado}, que guarda o texto livre anterior, <strong>não</strong> é
 * mapeada aqui de propósito: é arquivo histórico, e mapeá-la convidaria código novo a escrever
 * nela. Consultas de auditoria usam SQL direto.
 */
@Entity
@Table(name = "local")
public class Local {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoLocal tipo;

    /** Oito dígitos, sem formatação. A máscara é responsabilidade da interface. */
    private String cep;

    private String rua;

    /** Texto, não número: imóveis sem numeração ("s/n") e sufixos ("120A") são legítimos. */
    private String numero;

    private String complemento;

    private String bairro;

    private String cidade;

    @Enumerated(EnumType.STRING)
    private Uf uf;

    @Column(nullable = false)
    private boolean arquivado = false;

    // Preenchido pelo default do banco (now()); recarregado após o insert (@Generated),
    // para que a resposta do cadastro já traga a data. Não é inserido/atualizado pela aplicação.
    @Generated(event = EventType.INSERT)
    @Column(name = "criado_em", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime criadoEm;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public TipoLocal getTipo() {
        return tipo;
    }

    public void setTipo(TipoLocal tipo) {
        this.tipo = tipo;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getRua() {
        return rua;
    }

    public void setRua(String rua) {
        this.rua = rua;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getComplemento() {
        return complemento;
    }

    public void setComplemento(String complemento) {
        this.complemento = complemento;
    }

    public String getBairro() {
        return bairro;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public Uf getUf() {
        return uf;
    }

    public void setUf(Uf uf) {
        this.uf = uf;
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
