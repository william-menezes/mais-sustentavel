# Research — Cálculo do valor social (IS-01)

Fase 0. Decisões técnicas para agregar o valor social sobre as `Coleta` (OP-03). Sem NEEDS CLARIFICATION pendente (escopo já fechado: backend puro; período = filtro por intervalo **+** série mensal).

## D1 — Agregação por consulta (não carregar entidades)

- **Decisão**: agregar no banco via JPQL `sum`/`group by` num `ImpactoRepository` dedicado, retornando **projeções** (não entidades `Coleta`). Total: `select coalesce(sum(c.litrosReais), 0) from Coleta c ...`.
- **Rationale**: evita N+1 e materialização desnecessária; segue o padrão já usado (`ColetaRepository.somarLitrosPorPonto` com `coalesce`). Base pequena, mas a soma no banco é correta e simples.
- **Alternativas**: carregar todas as coletas e somar em Java (descartado — não escala e duplica lógica que o SQL faz melhor).

## D2 — Conversão litros → valor social (precisão monetária)

- **Decisão**: somar litros no banco (mantendo `numeric(12,3)`), e em Java calcular `valorSocial = litros.multiply(BigDecimal.ONE).setScale(2, RoundingMode.HALF_UP)`. A taxa R$ 1,00/litro é constante do domínio (RN-G-02), definida no service (`TAXA = BigDecimal.ONE`).
- **Rationale**: dá controle explícito de escala/arredondamento de moeda no código (2 casas), sem depender de casting do banco. Como a taxa é 1,00, o valor social é numericamente os litros arredondados a 2 casas — mas a multiplicação fica explícita para o dia em que a taxa mudar (fora de escopo agora).
- **Alternativas**: multiplicar no SQL (descartado — controle de escala/moeda menos explícito e mais dependente do dialeto).

## D3 — Agregação por local

- **Decisão**: JPQL com `join` até o local e `group by`:
  `select l.id as localId, l.nome as localNome, coalesce(sum(c.litrosReais),0) as litros from Coleta c join c.ponto p join p.local l [filtro de data] group by l.id, l.nome order by l.nome`.
  Retorno por **projeção baseada em interface** (`LocalAgregado { getLocalId(); getLocalNome(); getLitros(); }`).
- **Rationale**: projeção de interface é o caminho idiomático do Spring Data para linhas agregadas; o service converte litros→R$ e monta o DTO. Só entram locais que têm coletas (linha zero não aparece) — coerente com o cenário 2 da US2.
- **Alternativas**: `constructor expression` para um record (equivalente; interface escolhida por simplicidade e por dispensar FQN no JPQL).

## D4 — Série mensal (ano-mês)

- **Decisão**: agrupar por ano e mês com funções HQL portáveis `year(c.data)` e `month(c.data)`:
  `select year(c.data) as ano, month(c.data) as mes, coalesce(sum(c.litrosReais),0) as litros from Coleta c [filtro] group by year(c.data), month(c.data) order by ano, mes`.
  Projeção `MensalAgregado { getAno(); getMes(); getLitros(); }`; o service formata `competencia = "%04d-%02d"`.
- **Rationale**: `year()`/`month()` são funções HQL padrão (traduzem para `extract`), evitando `to_char` específico do Postgres — mantém o teste no Testcontainers fiel ao dialeto de produção sem SQL nativo. Formatação do rótulo "YYYY-MM" em Java, ordenada cronologicamente.
- **Alternativas**: SQL nativo com `to_char(data,'YYYY-MM')` (descartado — acopla ao dialeto e sai do JPQL); `date_trunc` retornando date (viável, mas exige projeção de data e formatação; `year/month` é mais direto).

## D5 — Filtro por intervalo de datas (opcional, inclusivo)

- **Decisão**: parâmetros `de` e `ate` (`LocalDate`, ISO `yyyy-MM-dd`), **ambos opcionais**, aplicados de forma uniforme aos três recortes com predicados nuláveis:
  `(:de is null or c.data >= :de) and (:ate is null or c.data <= :ate)`. Intervalo **inclusivo**; extremo omitido ⇒ aberto naquele lado.
- **Rationale**: um único padrão de filtro reutilizado nas três consultas; parametrizado (sem SQL dinâmico — Art. 7.6). `>=`/`<=` garantem inclusão das bordas (SC-003).
- **Alternativas**: métodos derivados `Between` (não cobrem extremos opcionais); montar query dinâmica/Specification (descartado — complexidade desnecessária para 2 filtros).

## D6 — Desenho dos endpoints

- **Decisão**: módulo `impacto` com 3 endpoints GET, um por recorte (mapeiam 1:1 às US1/US2/US3):
  - `GET /api/impacto/valor-social` → total `{ litrosReais, valorSocial }`.
  - `GET /api/impacto/valor-social/por-local` → `ValorSocialLocalResponse[]`.
  - `GET /api/impacto/valor-social/mensal` → `ValorSocialMensalResponse[]`.
  Todos aceitam `?de=&ate=` opcionais.
- **Rationale**: recortes explícitos, fáceis de testar e de consumir pela IS-02; o filtro de período é transversal (query param) em vez de endpoint próprio.
- **Alternativas**: endpoint único devolvendo total+local+mensal (descartado — resposta grande e menos coesa; a IS-02 pode preferir buscar só o que exibe).

## D7 — Validação de período e formato de data

- **Decisão**: `de > ate` → `PeriodoInvalidoException` (400) tratada em `ImpactoExceptionHandler` (reusa `ErroResponse` com mensagem genérica pt-BR "Período inválido"). Data em formato inválido → Spring lança `MethodArgumentTypeMismatchException`, tratada no mesmo handler → 400 "Dados inválidos". Validação antes de qualquer cálculo.
- **Rationale**: mantém o handler no módulo `impacto` (espelha `ColetaExceptionHandler`); mensagens genéricas (Art. 7). O `GlobalExceptionHandler` atual não trata type-mismatch, então não há conflito de `@RestControllerAdvice`.
- **Alternativas**: `@Validated` + constraints em params (não cobre a regra cruzada `de ≤ ate`); validação no controller (mantida no service para concentrar a regra — Art. 1).

## D8 — Segurança (sem config nova)

- **Decisão**: nada a adicionar em `SecurityConfig` — `/api/impacto/**` já cai em `.anyRequest().authenticated()` ⇒ **401** sem sessão. Sendo GET (somente leitura), não há escrita ⇒ **sem novo vetor CSRF**. CORS restrito e RLS na `coleta` reaproveitados.
- **Rationale**: menor superfície; consultas de leitura sob a mesma sessão do Gestor.
- **Alternativas**: regra explícita por path (desnecessária — o default já cobre).

## D9 — Sem migração / índice

- **Decisão**: **nenhuma migração Flyway nova**. Não há tabela nem coluna nova; a RLS de origem (`coleta`) já existe. Índice em `coleta(data)` foi **considerado** e **adiado**: volume MVP baixo (Art. 4.4 — escopo enxuto) e a decisão de índice não altera contrato/comportamento.
- **Rationale**: evita migração de baixo valor; se o volume crescer, um índice em `data` entra depois sem impacto no contrato.
- **Alternativas**: criar `V6` só para índice (descartado agora).

## D10 — Testes (Testcontainers + isolamento)

- **Decisão**: três classes de teste (`ImpactoRepositoryTest`, `ImpactoServiceTest`, `ImpactoControllerTest`), todas com **`@Transactional`** (rollback por teste), semeando `Local`/`Ponto`/`Coleta` reais. Controller com `MockMvc` (200/400/401). Números conferidos com tolerância para `BigDecimal` (ex.: `comparesEqualTo`/`closeTo`).
- **Rationale**: alinhado ao Art. 5 (TDD, Docker) e à lição da OP-03 (isolamento por `@Transactional` evita poluição entre classes na base compartilhada do Testcontainers).
- **Alternativas**: `@DataJpaTest` isolado (o projeto padronizou contexto completo com Testcontainers; manter consistência).
