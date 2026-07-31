package br.com.maissustentavel.api.local;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.domain.Uf;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.local.service.LocalNaoEncontradoException;
import br.com.maissustentavel.api.local.service.LocalService;
import br.com.maissustentavel.api.local.web.dto.LocalRequest;
import br.com.maissustentavel.api.local.web.dto.LocalResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regras de negócio de Local: criar e editar com endereço estruturado (US1),
 * arquivar/listar (US2), reativar, idempotência e "não encontrado".
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class LocalServiceTest {

    @Autowired
    LocalService servico;
    @Autowired
    LocalRepository repositorio;

    @BeforeEach
    void limpar() {
        repositorio.deleteAll();
    }

    private LocalRequest req(String nome, TipoLocal tipo) {
        return new LocalRequest(nome, tipo, LocalFixture.CEP, LocalFixture.RUA, LocalFixture.NUMERO,
                null, LocalFixture.BAIRRO, LocalFixture.CIDADE, LocalFixture.UF);
    }

    @Test
    void criarPersisteAtivoComIdECriadoEm() {
        LocalResponse r = servico.criar(req("Escola A", TipoLocal.ESCOLA));

        assertNotNull(r.id());
        assertNotNull(r.criadoEm());
        assertFalse(r.arquivado());
        assertEquals(TipoLocal.ESCOLA, r.tipo());
    }

    @Test
    void criarPersisteOsComponentesDoEndereco() {
        LocalResponse r = servico.criar(req("Escola A", TipoLocal.ESCOLA));

        assertEquals(LocalFixture.CEP, r.cep());
        assertEquals(LocalFixture.RUA, r.rua());
        assertEquals(LocalFixture.NUMERO, r.numero());
        assertEquals(LocalFixture.BAIRRO, r.bairro());
        assertEquals(LocalFixture.CIDADE, r.cidade());
        assertEquals(Uf.MG, r.uf());
        assertNull(r.complemento());
    }

    @Test
    void criarAceitaComplementoInformado() {
        LocalResponse r = servico.criar(new LocalRequest("Empresa A", TipoLocal.EMPRESA,
                LocalFixture.CEP, LocalFixture.RUA, LocalFixture.NUMERO, "Bloco B, sala 2",
                LocalFixture.BAIRRO, LocalFixture.CIDADE, LocalFixture.UF));

        assertEquals("Bloco B, sala 2", r.complemento());
    }

    @Test
    void listarSeparaAtivosDeArquivados() {
        LocalResponse ativo = servico.criar(req("Ativo", TipoLocal.OUTRO));
        LocalResponse arquivado = servico.criar(req("Arq", TipoLocal.OUTRO));
        servico.arquivar(arquivado.id());

        List<LocalResponse> ativos = servico.listar(false);
        List<LocalResponse> arquivados = servico.listar(true);

        assertEquals(1, ativos.size());
        assertEquals(ativo.id(), ativos.get(0).id());
        assertEquals(1, arquivados.size());
        assertEquals(arquivado.id(), arquivados.get(0).id());
    }

    @Test
    void arquivarEhIdempotente() {
        LocalResponse r = servico.criar(req("X", TipoLocal.EMPRESA));
        servico.arquivar(r.id());
        LocalResponse depois = servico.arquivar(r.id());

        assertTrue(depois.arquivado());
        assertEquals(1, servico.listar(true).size());
    }

    @Test
    void reativarVoltaParaAtivos() {
        LocalResponse r = servico.criar(req("X", TipoLocal.EMPRESA));
        servico.arquivar(r.id());
        LocalResponse depois = servico.reativar(r.id());

        assertFalse(depois.arquivado());
        assertEquals(1, servico.listar(false).size());
    }

    @Test
    void editarAtualizaOsCampos() {
        LocalResponse r = servico.criar(req("Nome Antigo", TipoLocal.ESCOLA));
        LocalResponse editado = servico.editar(r.id(), new LocalRequest("Nome Novo", TipoLocal.EMPRESA,
                "01310930", "Avenida Paulista", "1578", null, "Bela Vista", "São Paulo", Uf.SP));

        assertEquals("Nome Novo", editado.nome());
        assertEquals(TipoLocal.EMPRESA, editado.tipo());
        assertEquals("01310930", editado.cep());
        assertEquals("Avenida Paulista", editado.rua());
        assertEquals("São Paulo", editado.cidade());
        assertEquals(Uf.SP, editado.uf());
    }

    @Test
    void editarAlterandoSoONumeroPreservaOsDemaisComponentes() {
        LocalResponse r = servico.criar(req("Escola A", TipoLocal.ESCOLA));

        LocalResponse editado = servico.editar(r.id(), new LocalRequest("Escola A", TipoLocal.ESCOLA,
                LocalFixture.CEP, LocalFixture.RUA, "999", null,
                LocalFixture.BAIRRO, LocalFixture.CIDADE, LocalFixture.UF));

        assertEquals("999", editado.numero());
        assertEquals(LocalFixture.CEP, editado.cep());
        assertEquals(LocalFixture.RUA, editado.rua());
        assertEquals(LocalFixture.BAIRRO, editado.bairro());
        assertEquals(LocalFixture.CIDADE, editado.cidade());
        assertEquals(Uf.MG, editado.uf());
    }

    @Test
    void operacoesEmIdInexistenteLancamNaoEncontrado() {
        UUID inexistente = UUID.randomUUID();

        assertThrows(LocalNaoEncontradoException.class, () -> servico.detalhar(inexistente));
        assertThrows(LocalNaoEncontradoException.class, () -> servico.arquivar(inexistente));
        assertThrows(LocalNaoEncontradoException.class, () -> servico.reativar(inexistente));
        assertThrows(LocalNaoEncontradoException.class,
                () -> servico.editar(inexistente, req("X", TipoLocal.OUTRO)));
    }
}
