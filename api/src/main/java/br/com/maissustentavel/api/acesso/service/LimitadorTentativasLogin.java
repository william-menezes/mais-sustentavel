package br.com.maissustentavel.api.acesso.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting simples (janela fixa, em memória) para o login (FR-010): limita
 * tentativas por chave (IP) dentro de uma janela de tempo. Suficiente para o MVP
 * mono-instância. Para múltiplas instâncias, trocar por Bucket4j + store distribuído.
 */
@Component
public class LimitadorTentativasLogin {

    private static final int MAX_TENTATIVAS = 10;
    private static final long JANELA_MS = 60_000L;

    private record Janela(int contador, long inicioMs) {
    }

    private final Map<String, Janela> tentativas = new ConcurrentHashMap<>();

    /** Registra uma tentativa; retorna {@code true} se ainda dentro do limite. */
    public synchronized boolean permitir(String chave, long agoraMs) {
        Janela janela = tentativas.get(chave);
        if (janela == null || agoraMs - janela.inicioMs() >= JANELA_MS) {
            tentativas.put(chave, new Janela(1, agoraMs));
            return true;
        }
        if (janela.contador() >= MAX_TENTATIVAS) {
            return false;
        }
        tentativas.put(chave, new Janela(janela.contador() + 1, janela.inicioMs()));
        return true;
    }

    public boolean permitir(String chave) {
        return permitir(chave, System.currentTimeMillis());
    }

    /** Limpa o estado — uso em testes. */
    public void limpar() {
        tentativas.clear();
    }
}
