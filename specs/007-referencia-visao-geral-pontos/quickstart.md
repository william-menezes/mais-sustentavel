# Fase 1 — Roteiro de validação: Referência da estação e visão geral de Pontos

Valida os critérios **SC-001 a SC-012** da [spec.md](spec.md) com a aplicação rodando. Cada roteiro
diz o que observar e **por que aquilo importa** — sem o motivo, um passo que passa por acidente parece
sucesso.

## Pré-requisitos

Ambiente local de pé (Java só em Docker, Art. 1.6):

```bash
docker compose up -d          # Postgres + API na 8080
cd frontend && npm start      # SPA na 4200
```

Entrar como Gestor em `http://localhost:4200`.

**Base com dados é obrigatória para os roteiros 1 e 6.** Precisa existir pelo menos:

- dois locais ativos, cada um com pelo menos duas estações;
- uma estação **sem referência**, cadastrada antes da V7 — é o caso que o roteiro 6 verifica;
- uma estação com coletas registradas, sendo **pelo menos uma sem coletor informado**;
- uma estação sem nenhuma coleta;
- um local arquivado.

Testes automatizados, antes de olhar a tela:

```bash
cd frontend && npx ng test --watch=false   # frontend
cd frontend && npm run build               # sem estouro de orçamento
```

### Rodando a suíte do backend neste host

Java vive só no Docker (Art. 1.6) e por um tempo se acreditou que **Testcontainers não rodasse aqui**,
porque ele tenta o socket Unix local e o Docker Desktop no Windows recusa a conexão aninhada. A saída é
**montar o socket** e dizer ao Testcontainers em que host o Docker responde:

```bash
docker run --rm \
  -v "<caminho-absoluto>/api:/app" \
  -v mais-sustentavel-m2:/root/.m2 \
  -v //var/run/docker.sock:/var/run/docker.sock \
  -w /app \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  --add-host=host.docker.internal:host-gateway \
  maven:3.9-eclipse-temurin-21 mvn -B verify
```

No PowerShell, obtenha o caminho com `(Resolve-Path .\api).Path` — no Git Bash a conversão automática de
caminho quebra o `-v` e o `-w`. O volume `mais-sustentavel-m2` guarda as dependências entre execuções;
sem ele cada execução baixa tudo de novo.

Para só compilar (Red de assinatura, muito mais rápido), troque `verify` por `test-compile` e dispense o
socket.

**Isso substitui a espera pelo CI** para verificar o backend. Vale saber que a descoberta é recente: as
primeiras fatias desta feature foram verificadas só por compilação, confiando no CI para a suíte.

---

## Roteiro 1 — Visão geral e a alternância (SC-001, SC-002, SC-011)

1. Clicar em **"Pontos de coleta"** no menu lateral.
   - **Antes desta feature esse item não levava a lugar nenhum.** Se abrir a tela, o link morto foi
     consertado (FR-002).
2. Conferir que aparecem estações **de mais de um local** na mesma lista, cada uma dizendo a que local
   pertence (FR-001, FR-003).
3. Conferir que só as **ativas** aparecem e que o contador diz quantas de quantas (FR-006, FR-007).
4. Filtrar a coluna **Local** por um local pelo menu de funil. A contagem tem de acompanhar.
5. **Sem limpar o filtro**, alternar para **Cartões**.
   - **O filtro tem de continuar valendo** (FR-004). Se a lista voltar a mostrar tudo, o estado de
     filtro foi duplicado entre os dois modos — o defeito que a decisão D6 existe para evitar.
6. Alternar de volta para **Tabela** e confirmar que o filtro segue aplicado.
7. Abrir o menu de funil de **Situação** e escolher "Arquivado". Conferir que as arquivadas aparecem.
   - **Abrir o funil e ver o valor selecionado**, não um campo vazio. Se o painel abrir sem o valor
     que está filtrando, é a regressão da 006: filtro aplicado por API imperativa em vez de declarado.
8. Reduzir a janela a **360 px** de largura e repetir os passos 4 a 6.
   - Sem rolagem horizontal do conteúdo (FR-053, SC-011).

---

## Roteiro 2 — Cadastrar estação em local existente (SC-004, SC-010)

1. Clicar em **"Novo ponto"**. O painel abre pela direita (à esquerda do rodapé fica o aviso de
   pendências).
2. **Sem preencher nada**, observar o rodapé.
   - Tem de dizer que falta escolher o local, e o botão de concluir tem de estar indisponível (FR-024,
     FR-049). **Descobrir o que falta sem tentar salvar** é o SC-010.
3. Digitar três letras do nome de um local e conferir as sugestões.
4. Digitar um **bairro** e conferir que os locais daquele bairro aparecem (FR-020).
5. Digitar o nome **sem acento** de um local acentuado — "Uberlandia" para "Uberlândia".
   - Tem de encontrar. Quem digita rápido não acentua (D7).
6. Buscar um local **arquivado** pelo nome exato.
   - **Não pode aparecer** (FR-021). Oferecê-lo produziria recusa do servidor logo depois.
7. Escolher o local. Observar que o rodapé agora cobra a **referência**.
8. Informar a referência com **espaços antes e depois** ("  pátio  ") e concluir.
9. Conferir que a estação aparece na lista com a referência **sem os espaços** (FR-016) e que o QR está
   disponível.
10. Abrir o painel outra vez, preencher e **cancelar**.
    - Nenhuma estação criada (FR-025).

---

## Roteiro 3 — Ficha da estação (SC-006, SC-007, SC-008, SC-009, SC-012)

1. Abrir a ficha de uma estação **com coletas**.
2. Conferir os três indicadores contra o histórico logo abaixo:
   - o total tem de bater com a **soma das linhas listadas** — ele vem somado do servidor, então este
     passo confere se a resposta e a lista falam do mesmo ponto;
   - o valor social é esse total a **R$ 1,00 por litro** (RN-G-02);
   - a média é o total dividido pela **quantidade de coletas** — a única conta feita na tela.
   - **Somar à mão as linhas do histórico e comparar.** É o SC-007, e a decisão D5 o garante por
     construção: os três números vêm da mesma resposta que alimenta a lista.
3. Localizar a coleta **sem coletor informado**.
   - A linha tem de indicar a ausência, não deixar o espaço vazio (FR-036, SC-009). Espaço vazio
     pareceria falha de carregamento.
4. Conferir que as coletas estão da **mais recente para a mais antiga** (FR-035).
5. Clicar em **copiar o link** do QR. Colar em uma nova aba do navegador.
   - **Tem de abrir a estação correta** (SC-008). O endereço exibido pode estar abreviado; o copiado
     precisa ser o completo. Se abrir "página não encontrada", copiou-se o texto truncado — o defeito
     que passa em revisão visual e só aparece quando alguém cola o link numa conversa.
6. Baixar o QR e conferir que o arquivo abre e o código é legível por leitor de celular.
7. Abrir a ficha de uma estação **sem nenhuma coleta**.
   - Total e valor social em zero — que é o dado correto — e a média **não** como zero (FR-034).
     Zero afirmaria que as coletas vieram vazias.
8. Escolher **ver o local** na ficha.
   - A ficha do Local abre **por cima**, com recuo, e a da estação continua atrás (FR-037).
9. **Derrubar a API** (`docker compose stop api`) e abrir a ficha de uma estação.
   - O resto da ficha continua utilizável e há aviso de que o histórico não veio (FR-041, SC-012).
     Subir a API de novo depois.

---

## Roteiro 4 — Criar o local sem perder o cadastro da estação (SC-005)

1. Abrir **"Novo ponto"**.
2. Digitar a **referência primeiro** ("garagem"), antes de escolher o local. Isso importa para o passo 7.
3. No campo de local, buscar um nome que **não existe** ("Condomínio Inexistente").
4. Conferir que aparece a oferta de **"+ adicionar local"** (FR-042).
5. Clicar. O formulário de Local abre **sobre** o cadastro da estação.
   - **O painel de baixo tem de continuar visível pela borda** (FR-043, FR-044). Se os dois se
     sobrepuserem exatamente, o recuo por nível não foi aplicado.
6. Preencher o local — inclusive testando o preenchimento por CEP, que vem da 006 — e concluir.
7. Conferir os três resultados de uma vez (FR-045, FR-046):
   - o formulário de Local **fechou**;
   - o local criado está **escolhido** no campo;
   - a referência "garagem" **continua preenchida**.
   - O terceiro é o ponto da história: é exatamente o que se perderia hoje.
8. Concluir o cadastro da estação e conferir que ela aparece na lista, no local novo.
9. Repetir do passo 3, mas **cancelar** o formulário de Local.
   - Nenhum local criado e o cadastro da estação volta intacto (FR-047).

---

## Roteiro 5 — Editar a referência e arquivar (SC-002)

1. Abrir a ficha de uma estação e escolher **Editar**.
2. Alterar a referência e concluir.
3. Conferir que a lista mostra a referência nova (FR-015, FR-039).
4. Abrir duas estações **do mesmo local** na lista, uma ao lado da outra.
   - **Distinguíveis sem abrir nenhuma das duas** (SC-002). Se as duas linhas parecerem iguais, a
     referência não está compondo a identificação.
5. Arquivar uma estação pela ficha.
   - Sai da lista de ativas; o histórico e o valor social permanecem (FR-038, RN-G-06). Conferir pelo
     filtro de Situação.
6. Reativar e conferir que volta.

---

## Roteiro 6 — Acervo antigo e a V7 (SC-003)

Este roteiro é o que impede a feature de destruir dado, e precisa de **base com dados reais**.

1. **Antes de subir a V7**, anotar quantas estações existem e os identificadores de duas delas:

```sql
select count(*) from ponto;
select id, local_id, qr_conteudo from ponto limit 2;
```

2. Subir a API para a V7 rodar.
3. Conferir que a coluna existe e que **nenhuma estação foi perdida**:

```sql
select count(*) from ponto;                          -- mesmo número de antes
select id, referencia from ponto where referencia is null;
```

4. Conferir a restrição de tamanho:

```sql
-- deve falhar
update ponto set referencia = repeat('x', 61) where id = '<algum-id>';
```

5. Na tela, localizar uma estação **sem referência**.
   - Identificada pela **referência curta** de oito caracteres, e **nenhum rótulo inventado** (FR-012,
     FR-013, SC-003). Se aparecer "estação 1" ou "portaria", um sentinela vazou para o título.
6. Editar essa estação, dar uma referência, e conferir que ela sai da fila:

```sql
select id, local_id from ponto where referencia is null;   -- uma linha a menos
```

7. Conferir que o **QR não mudou**: comparar `qr_conteudo` com o anotado no passo 1.
   - Editar a referência **não pode** alterar o QR. Um QR novo invalidaria o adesivo já colado na parede.

---

## Roteiro 7 — Validação no servidor e segurança (Art. 7.6, FR-018)

Contornando o formulário, com a sessão de Gestor:

```bash
# referência ausente → 400
curl -i -X POST http://localhost:8080/api/locais/<localId>/pontos \
  -H 'Content-Type: application/json' -b cookies.txt -H "X-XSRF-TOKEN: <token>" \
  -d '{}'

# só espaços → 400, não um nulo aceito
  -d '{"referencia": "   "}'

# acima de 60 caracteres → 400
  -d '{"referencia": "xxxxxxxxxx...61"}'

# tentar mover a estação de local pela edição → o local é ignorado, nunca alterado
curl -i -X PUT http://localhost:8080/api/pontos/<id> \
  -d '{"referencia": "pátio", "localId": "<outro-local>"}'
```

Conferir também:

- **nenhum corpo de erro** expõe stacktrace, SQL ou detalhe interno (Art. 7.6);
- a resposta do `PUT` mantém o **`localId` original** — mover estação reescreveria histórico de dois
  locais (RN-G-05, D3);
- **RLS segue habilitada** na tabela `ponto`;
- **todos os rótulos e mensagens novos em pt-BR** (FR-052) — inclusive os do menu de filtro, que vêm da
  tradução centralizada;
- nenhuma **superfície pública** passou a expor dado novo (FR-054).

---

## Encerramento

```bash
docker compose run --rm api mvn verify
cd frontend && npx ng test --watch=false && npm run build
```

Os três verdes, e o build **sem aviso de orçamento** — a tela nova tem de ficar em chunk sob demanda,
não no bundle inicial.
