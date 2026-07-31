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
import br.com.maissustentavel.api.ponto.web.dto.PontoRequest;
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
 * Regras de Ponto: cadastro (local ativo, referência obrigatória e normalizada, QR único,
 * atomicidade), edição da referência, soft delete, "não encontrado". O gerador de QR é mockado
 * para poder forçar a falha de geração.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PontoServiceTest {

    private static final String PATIO = "pátio";
    private static final String PATIO_COBERTO = "pátio coberto";
    private static final String BLOCO_B = "bloco B";
    private static final String SO_ESPACOS = "   ";

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

    /** Cadastro com a referência padrão, para os testes que não se importam com o valor dela. */
    private PontoResponse criar(UUID localId) {
        return servico.criar(localId, new PontoRequest(PontoFixture.REFERENCIA));
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
        criar(a);
        criar(b);

        var todos = servico.listarTodos(false);

        assertEquals(2, todos.size());
    }

    @Test
    void listarTodosPreencheONomeDoLocal() {
        // É metade da identificação "Local · referência" na lista (FR-003). Sem isso o cartão diria
        // apenas a referência, e duas estações homônimas em locais diferentes ficariam iguais.
        UUID localId = local(false);
        when(geradorQrCode.gerarPng(anyString())).thenReturn(new byte[]{1});
        criar(localId);

        assertEquals("Ativo", servico.listarTodos(false).getFirst().localNome());
    }

    @Test
    void listarTodosSeparaAtivosDeArquivados() {
        UUID localId = local(false);
        when(geradorQrCode.gerarPng(anyString())).thenReturn(new byte[]{1});
        PontoResponse criado = criar(localId);
        servico.arquivar(criado.id());

        assertTrue(servico.listarTodos(false).isEmpty());
        assertEquals(1, servico.listarTodos(true).size());
    }

    @Test
    void criarPersisteComReferenciaQrECriadoEm() {
        UUID localId = local(false);
        PontoResponse r = servico.criar(localId, new PontoRequest(PATIO));

        assertNotNull(r.id());
        assertEquals(localId, r.localId());
        assertEquals(PATIO, r.referencia());
        assertFalse(r.arquivado());
        assertTrue(r.qrConteudo().contains(r.id().toString()));
        assertNotNull(r.criadoEm());
        verify(geradorQrCode).gerarPng(anyString());
    }

    @Test
    void doisPontosTemQrsDistintos() {
        UUID localId = local(false);
        assertNotEquals(criar(localId).qrConteudo(), criar(localId).qrConteudo());
    }

    @Test
    void localInexistenteLanca404() {
        assertThrows(LocalNaoEncontradoException.class, () -> criar(UUID.randomUUID()));
    }

    @Test
    void localArquivadoLanca409() {
        UUID localId = local(true);
        assertThrows(LocalNaoDisponivelException.class, () -> criar(localId));
    }

    @Test
    void falhaNaGeracaoDoQrNaoPersisteOPonto() {
        UUID localId = local(false);
        when(geradorQrCode.gerarPng(anyString())).thenThrow(new QrCodeException(new RuntimeException("falha")));

        assertThrows(QrCodeException.class, () -> criar(localId));
        assertTrue(servico.listar(localId, false).isEmpty());
    }

    // ---------- US2: referência normalizada no cadastro ----------

    @Test
    void criarDescartaEspacosEmVoltaDaReferencia() {
        // O que é persistido tem de já estar normalizado (FR-016): a referência é a chave de
        // ordenação e de filtro, e "  pátio  " gravado assim ordenaria antes de tudo.
        UUID localId = local(false);

        PontoResponse r = servico.criar(localId, new PontoRequest("  pátio  "));

        assertEquals(PATIO, r.referencia());
        assertEquals(PATIO, pontoRepository.findById(r.id()).orElseThrow().getReferencia());
    }

    @Test
    void criarRecusaReferenciaSoComEspacos() {
        // Recusa, nunca conversão em nulo: a coluna aceita nulo para o acervo anterior à V7, então
        // normalizar "   " para nulo produziria uma estação anônima indistinguível das antigas e
        // furaria a obrigatoriedade por dentro (research D4).
        UUID localId = local(false);

        assertThrows(IllegalArgumentException.class, () -> servico.criar(localId, new PontoRequest(SO_ESPACOS)));
        assertTrue(servico.listar(localId, false).isEmpty());
    }

    // ---------- US2: edição da referência ----------

    @Test
    void editarAlteraAReferencia() {
        UUID localId = local(false);
        PontoResponse criado = servico.criar(localId, new PontoRequest(PATIO));

        PontoResponse editado = servico.editar(criado.id(), new PontoRequest(PATIO_COBERTO));

        assertEquals(PATIO_COBERTO, editado.referencia());
        assertEquals(PATIO_COBERTO, pontoRepository.findById(criado.id()).orElseThrow().getReferencia());
    }

    @Test
    void editarDescartaEspacosEmVoltaDaReferencia() {
        UUID localId = local(false);
        PontoResponse criado = criar(localId);

        assertEquals(BLOCO_B, servico.editar(criado.id(), new PontoRequest("  bloco B  ")).referencia());
    }

    @Test
    void editarRecusaReferenciaSoComEspacosEPreservaAAnterior() {
        UUID localId = local(false);
        PontoResponse criado = servico.criar(localId, new PontoRequest(PATIO));

        assertThrows(IllegalArgumentException.class,
                () -> servico.editar(criado.id(), new PontoRequest(SO_ESPACOS)));
        assertEquals(PATIO, pontoRepository.findById(criado.id()).orElseThrow().getReferencia());
    }

    @Test
    void editarNaoMoveAEstacaoDeLocal() {
        // RN-G-05: o QR já colado na parede aponta para uma estação que o morador associa àquele
        // endereço. Mover reescreveria o histórico de coletas de dois locais, inclusive valor social
        // já publicado — por isso a requisição de edição não tem por onde informar outro local.
        UUID localId = local(false);
        PontoResponse criado = criar(localId);

        assertEquals(localId, servico.editar(criado.id(), new PontoRequest(BLOCO_B)).localId());
    }

    @Test
    void editarNaoAlteraOQrConteudo() {
        // Um QR novo invalidaria o adesivo já impresso; corrigir o rótulo não é trocar a estação.
        UUID localId = local(false);
        PontoResponse criado = criar(localId);

        assertEquals(criado.qrConteudo(),
                servico.editar(criado.id(), new PontoRequest(BLOCO_B)).qrConteudo());
    }

    @Test
    void editarEstacaoArquivadaCorrigeAReferenciaSemReativar() {
        // Arquivar preserva histórico (RN-G-06) e corrigir o rótulo de um registro histórico não o
        // devolve à operação.
        UUID localId = local(false);
        PontoResponse criado = criar(localId);
        servico.arquivar(criado.id());

        PontoResponse editado = servico.editar(criado.id(), new PontoRequest(BLOCO_B));

        assertEquals(BLOCO_B, editado.referencia());
        assertTrue(editado.arquivado());
    }

    @Test
    void editarEstacaoInexistenteLancaNaoEncontrado() {
        assertThrows(PontoNaoEncontradoException.class,
                () -> servico.editar(UUID.randomUUID(), new PontoRequest(BLOCO_B)));
    }

    @Test
    void arquivarEReativar() {
        UUID localId = local(false);
        PontoResponse p = criar(localId);

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
