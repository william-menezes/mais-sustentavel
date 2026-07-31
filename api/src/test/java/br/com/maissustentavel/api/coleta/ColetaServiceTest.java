package br.com.maissustentavel.api.coleta;

import br.com.maissustentavel.api.TestcontainersConfiguration;
import br.com.maissustentavel.api.auth.domain.Papel;
import br.com.maissustentavel.api.auth.domain.Usuario;
import br.com.maissustentavel.api.auth.repository.PapelRepository;
import br.com.maissustentavel.api.auth.repository.UsuarioRepository;
import br.com.maissustentavel.api.coleta.repository.ColetaRepository;
import br.com.maissustentavel.api.coleta.service.ColetaService;
import br.com.maissustentavel.api.coleta.service.PontoIndisponivelException;
import br.com.maissustentavel.api.coleta.web.dto.ColetaRequest;
import br.com.maissustentavel.api.coleta.web.dto.ColetaResponse;
import br.com.maissustentavel.api.coleta.web.dto.ColetasDoPontoResponse;
import br.com.maissustentavel.api.local.LocalFixture;
import br.com.maissustentavel.api.local.domain.Local;
import br.com.maissustentavel.api.local.domain.TipoLocal;
import br.com.maissustentavel.api.local.repository.LocalRepository;
import br.com.maissustentavel.api.ponto.domain.Ponto;
import br.com.maissustentavel.api.ponto.repository.PontoRepository;
import br.com.maissustentavel.api.ponto.service.PontoNaoEncontradoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regras de Coleta: registro (ponto ativo, coletor resolvido/null), 404/409 e total.
 * (Validação de litros/data é do DTO — coberta no ColetaControllerTest.)
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class ColetaServiceTest {

    @Autowired
    ColetaService servico;
    @Autowired
    ColetaRepository coletaRepository;
    @Autowired
    PontoRepository pontoRepository;
    @Autowired
    LocalRepository localRepository;
    @Autowired
    UsuarioRepository usuarioRepository;
    @Autowired
    PapelRepository papelRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    @BeforeEach
    void limpar() {
        coletaRepository.deleteAll();
        pontoRepository.deleteAll();
        localRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    private Ponto ponto(boolean arquivado) {
        Local l = new Local();
        l.setNome("Local");
        LocalFixture.comEnderecoValido(l);
        l.setTipo(TipoLocal.ESCOLA);
        localRepository.saveAndFlush(l);
        Ponto p = new Ponto();
        p.setId(UUID.randomUUID());
        p.setLocal(l);
        p.setQrConteudo("http://localhost:4200/p/" + p.getId());
        p.setArquivado(arquivado);
        return pontoRepository.saveAndFlush(p);
    }

    private ColetaRequest req(String litros) {
        return new ColetaRequest(new BigDecimal(litros), LocalDate.now().minusDays(1));
    }

    private String usuario(String nome, String email) {
        Papel gestor = papelRepository.findByNome("Gestor").orElseThrow();
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenhaHash(passwordEncoder.encode("x"));
        u.getPapeis().add(gestor);
        usuarioRepository.save(u);
        return email;
    }

    @Test
    void registrarAssociaAoPontoESoma() {
        Ponto p = ponto(false);
        String email = usuario("Coletor Fulano", "coletor@teste.com");

        ColetaResponse r = servico.registrar(p.getId(), req("12.5"), email);

        assertEquals(p.getId(), r.pontoId());
        assertEquals(0, r.litrosReais().compareTo(new BigDecimal("12.5")));
        assertEquals("Coletor Fulano", r.coletorNome());
        assertNotNull(r.criadoEm());
        assertEquals(0, servico.listarDoPonto(p.getId()).totalLitros().compareTo(new BigDecimal("12.5")));
    }

    @Test
    void coletorInexistenteFicaNull() {
        Ponto p = ponto(false);
        assertNull(servico.registrar(p.getId(), req("5"), "naoexiste@teste.com").coletorNome());
    }

    @Test
    void pontoInexistenteLanca404() {
        assertThrows(PontoNaoEncontradoException.class,
                () -> servico.registrar(UUID.randomUUID(), req("5"), null));
    }

    @Test
    void pontoArquivadoLanca409() {
        Ponto p = ponto(true);
        assertThrows(PontoIndisponivelException.class,
                () -> servico.registrar(p.getId(), req("5"), null));
    }

    @Test
    void totalSomaVariasColetasEZeroSemColetas() {
        Ponto p = ponto(false);
        assertTrue(servico.listarDoPonto(p.getId()).coletas().isEmpty());
        assertEquals(0, servico.listarDoPonto(p.getId()).totalLitros().compareTo(BigDecimal.ZERO));

        servico.registrar(p.getId(), req("10"), null);
        servico.registrar(p.getId(), req("5.5"), null);

        ColetasDoPontoResponse resp = servico.listarDoPonto(p.getId());
        assertEquals(2, resp.coletas().size());
        assertEquals(0, resp.totalLitros().compareTo(new BigDecimal("15.5")));
    }
}
