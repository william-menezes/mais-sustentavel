package br.com.maissustentavel.api.ponto;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.local.LocalFixture;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.local.service.LocalNaoEncontradoException;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import br.com.maissustentavel.api.ponto.service.GeradorQrCode;
import br.com.maissustentavel.api.ponto.service.LocalNaoDisponivelException;
import br.com.maissustentavel.api.ponto.service.PontoNaoEncontradoException;
import br.com.maissustentavel.api.ponto.service.PontoService;
import br.com.maissustentavel.api.ponto.service.QrCodeException;
import br.com.maissustentavel.api.ponto.web.dto.PontoResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Regras de Ponto: cadastro (local ativo, QR único, atomicidade), soft delete, "não
 * encontrado". O gerador de QR é mockado para poder forçar a falha de geração.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PontoServiceTest {

    @Autowired
    PontoService servico;
    @Autowired
    PontoRepository pontoRepository;
    @Autowired
    LocalRepository localRepository;
    @MockitoBean
    GeradorQrCode geradorQrCode;

    @BeforeEach
    void limpar() {
        pontoRepository.deleteAll();
        localRepository.deleteAll();
    }

    private UUID local(boolean arquivado) {
        Local l = new Local();
        l.setNome(arquivado ? "Arquivado" : "Ativo");
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        l.setArquivado(arquivado);
        return localRepository.saveAndFlush(l).getId();
    }

    @Test
    void listarTodosTrazEstacoesDeLocaisDiferentes() {
        UUID a = local(false);
        Local outro = new Local();
        outro.setNome("Outro local");
        LocalFixture.comEnderecoValido(outro);
        outro.setTipo(TipoLocal.EMPRESA);
        UUID b = localRepository.saveAndFlush(outro).getId();
        when(geradorQrCode.gerarPng(anyString())).thenReturn(new byte[]{1});
        servico.criar(a);
        servico.criar(b);

        var todos = servico.listarTodos(false);

        assertEquals(2, todos.size());
    }

    @Test
    void listarTodosPreencheONomeDoLocal() {
        // É metade da identificação "Local · referência" na lista (FR-003). Sem isso o cartão diria
        // apenas a referência, e duas estações homônimas em locais diferentes ficariam iguais.
        UUID localId = local(false);
        when(geradorQrCode.gerarPng(anyString())).thenReturn(new byte[]{1});
        servico.criar(localId);

        assertEquals("Ativo", servico.listarTodos(false).getFirst().localNome());
    }

    @Test
    void listarTodosSeparaAtivosDeArquivados() {
        UUID localId = local(false);
        when(geradorQrCode.gerarPng(anyString())).thenReturn(new byte[]{1});
        PontoResponse criado = servico.criar(localId);
        servico.arquivar(criado.id());

        assertTrue(servico.listarTodos(false).isEmpty());
        assertEquals(1, servico.listarTodos(true).size());
    }

    @Test
    void criarPersisteComQrECriadoEm() {
        UUID localId = local(false);
        PontoResponse r = servico.criar(localId);

        assertNotNull(r.id());
        assertEquals(localId, r.localId());
        assertFalse(r.arquivado());
        assertTrue(r.qrConteudo().contains(r.id().toString()));
        assertNotNull(r.criadoEm());
        verify(geradorQrCode).gerarPng(anyString());
    }

    @Test
    void doisPontosTemQrsDistintos() {
        UUID localId = local(false);
        assertNotEquals(servico.criar(localId).qrConteudo(), servico.criar(localId).qrConteudo());
    }

    @Test
    void localInexistenteLanca404() {
        assertThrows(LocalNaoEncontradoException.class, () -> servico.criar(UUID.randomUUID()));
    }

    @Test
    void localArquivadoLanca409() {
        UUID localId = local(true);
        assertThrows(LocalNaoDisponivelException.class, () -> servico.criar(localId));
    }

    @Test
    void falhaNaGeracaoDoQrNaoPersisteOPonto() {
        UUID localId = local(false);
        when(geradorQrCode.gerarPng(anyString())).thenThrow(new QrCodeException(new RuntimeException("falha")));

        assertThrows(QrCodeException.class, () -> servico.criar(localId));
        assertTrue(servico.listar(localId, false).isEmpty());
    }

    @Test
    void arquivarEReativar() {
        UUID localId = local(false);
        PontoResponse p = servico.criar(localId);

        servico.arquivar(p.id());
        assertTrue(servico.listar(localId, false).isEmpty());
        assertEquals(1, servico.listar(localId, true).size());

        servico.reativar(p.id());
        assertEquals(1, servico.listar(localId, false).size());
    }

    @Test
    void operacoesEmPontoInexistenteLancamNaoEncontrado() {
        assertThrows(PontoNaoEncontradoException.class, () -> servico.arquivar(UUID.randomUUID()));
        assertThrows(PontoNaoEncontradoException.class, () -> servico.imagemQr(UUID.randomUUID()));
    }
}
