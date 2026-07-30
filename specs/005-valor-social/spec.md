# Feature Specification: Cálculo do valor social (IS-01)

**Feature Branch**: `005-valor-social`

**Created**: 2026-07-29

**Status**: Draft

**Input**: História IS-01 (Sprint 3) — "Como Gestor, quero que cada litro real vire valor social, para medir o impacto."

## User Scenarios & Testing *(mandatory)*

O valor social é um **agregado somente-leitura** derivado das coletas já registradas (OP-03). Não há entidade nova nem escrita: o sistema soma os litros reais e converte em reais à razão de **R$ 1,00 por litro** (RN-G-02), oferecendo três recortes de leitura ao Gestor. Todas as histórias são fatias independentes de uma mesma consulta de impacto.

### User Story 1 - Valor social total (Priority: P1)

Como Gestor autenticado, quero consultar o **total geral** de litros reais coletados e o valor social correspondente, para saber o impacto acumulado da iniciativa.

**Why this priority**: É o MVP da história — a conversão litro→real (RN-G-02) sobre toda a base de coletas. Entrega valor sozinha (o número que a iniciativa comunica) e é pré-requisito conceitual dos demais recortes.

**Independent Test**: Registrar coletas em pontos quaisquer e consultar o total; conferir que `valorSocial = litrosReais × 1,00` e que o cálculo usa a medição real, não qualquer valor declarado.

**Acceptance Scenarios**:

1. **Given** coletas registradas com litros reais, **When** consulto o valor social total, **Then** recebo a soma dos litros reais e o valor social igual a `R$ 1,00 × litros`.
2. **Given** nenhuma coleta registrada, **When** consulto o valor social total, **Then** recebo litros `0` e valor social `R$ 0,00` (resposta de sucesso, não erro).
3. **Given** coletas em pontos de um local **arquivado**, **When** consulto o total, **Then** essas coletas **continuam** somando ao total (o arquivamento preserva o valor social gerado — RN-G-06).

---

### User Story 2 - Valor social por local (Priority: P2)

Como Gestor autenticado, quero o valor social **agregado por local**, para comparar o impacto entre os locais atendidos.

**Why this priority**: Primeiro detalhamento útil sobre o total; sustenta a visão por local que a IS-02/IS-03 consumirão. Depende apenas da mesma base de coletas.

**Independent Test**: Registrar coletas em pontos de locais distintos e consultar a quebra por local; conferir que cada local traz somente os litros/valor das suas próprias coletas e que a soma das linhas equivale ao total geral.

**Acceptance Scenarios**:

1. **Given** coletas em locais distintos, **When** consulto o valor social por local, **Then** cada local traz seus próprios litros reais e valor social (`R$ 1,00 × litros do local`).
2. **Given** um local **ativo** sem coletas no período, **When** consulto a quebra por local, **Then** esse local aparece na lista com litros `0` e valor social `R$ 0,00`.
3. **Given** coletas em um local arquivado, **When** consulto por local, **Then** o local arquivado ainda aparece com seu valor social preservado (RN-G-06); um local arquivado **sem** coletas não aparece.

---

### User Story 3 - Valor social por período (Priority: P3)

Como Gestor autenticado, quero recortar o valor social **por período** — filtrando por um intervalo de datas e/ou obtendo a **série mensal** —, para acompanhar a evolução do impacto no tempo.

**Why this priority**: Enriquece os recortes anteriores com a dimensão temporal. Não bloqueia P1/P2 e é o insumo temporal que o painel (IS-02) usará.

**Independent Test**: Registrar coletas em datas/meses distintos; (a) consultar informando data inicial/final e conferir que só as coletas do intervalo entram; (b) consultar a série mensal e conferir uma entrada por ano-mês com o valor social somado.

**Acceptance Scenarios**:

1. **Given** coletas em datas distintas, **When** consulto informando data inicial e final, **Then** apenas as coletas com data dentro do intervalo **inclusivo** entram no cálculo.
2. **Given** apenas a data inicial (ou apenas a final), **When** consulto, **Then** o filtro é aberto no extremo omitido (a partir de / até a data informada).
3. **Given** coletas em meses distintos, **When** consulto a série mensal, **Then** recebo o valor social agregado por ano-mês, ordenado cronologicamente.
4. **Given** um intervalo sem nenhuma coleta, **When** consulto, **Then** o total do período é `R$ 0,00` e a série vem vazia (não é erro).

---

### Edge Cases

- **Data inicial posterior à final**: entrada inválida → o sistema rejeita a consulta com erro de validação (400), sem calcular.
- **Datas em formato inválido**: rejeitadas na borda (400) com mensagem genérica.
- **Base vazia / período vazio**: total zero e listas vazias, sempre com sucesso (nunca erro).
- **Coletas de locais/pontos arquivados**: contam no valor social (RN-G-06 preserva o histórico gerado).
- **Coleta sem coletor associado**: irrelevante para o valor social (o cálculo depende só de litros e data), logo entra normalmente.
- **Precisão**: litros somados sem perda (3 casas); valor social apresentado em reais (2 casas), sem distorção por arredondamento intermediário.
- **Acesso sem sessão**: consultas exigem sessão autenticada → **401** quando ausente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST calcular o valor social como `R$ 1,00 × litros reais` das coletas (RN-G-02), usando **sempre** a medição real (`Coleta.litrosReais`) e **nunca** qualquer valor declarado.
- **FR-002**: O sistema MUST expor o **total geral** de litros reais e o valor social correspondente sobre toda a base de coletas.
- **FR-003**: O sistema MUST expor o valor social **agregado por local**, trazendo, para cada local, seus litros reais e valor social. **Locais ativos** aparecem sempre (com `0` quando não têm coletas no período); **locais arquivados** aparecem apenas quando têm coletas (RN-G-06).
- **FR-004**: O sistema MUST permitir **filtrar por intervalo de datas** (data inicial e final, ambas **opcionais**), considerando apenas coletas cuja `data` caia no intervalo **inclusivo**; extremo omitido ⇒ intervalo aberto naquele lado.
- **FR-005**: O sistema MUST expor a **série mensal** do valor social, agregando por ano-mês e ordenada cronologicamente.
- **FR-006**: O sistema MUST tratar a ausência de coletas (ou período vazio) como **total zero e listas vazias**, respondendo com sucesso (não erro).
- **FR-007**: O sistema MUST **incluir** no cálculo as coletas de locais/pontos arquivados, preservando o valor social já gerado (RN-G-06).
- **FR-008**: O sistema MUST **validar** os parâmetros de período: datas em formato válido e `data inicial ≤ data final`; entrada inválida ⇒ rejeição com erro de validação, sem cálculo.
- **FR-009**: O sistema MUST expressar quantidades em **litros** (RN-G-12) e o valor social em **reais (BRL)**, com precisão adequada a moeda (2 casas) e a litros (3 casas), sem distorção por arredondamento.
- **FR-010**: O sistema MUST exigir **sessão autenticada** (Gestor) em todas as consultas de valor social; sem sessão ⇒ **401**.
- **FR-011**: As consultas MUST ser **somente leitura** (não alteram estado), sob CORS restrito; mensagens de erro genéricas, sem vazar detalhes internos.
- **FR-012**: Todo texto de interface/erro MUST estar em **português do Brasil** (RN-G-13).

### Key Entities *(include if feature involves data)*

- **Valor social (agregado)**: grandeza **calculada**, não persistida. Deriva de `Coleta` (litros reais + data) e do vínculo Coleta→Ponto→Local. Atributos de leitura: `litrosReais` (soma) e `valorSocial` (= litros × R$ 1,00).
- **Recorte por local**: par (Local, agregado) — identificação do local (id/nome) com seus litros e valor social.
- **Ponto de série mensal**: par (ano-mês, agregado) — competência mensal com litros e valor social.
- **Coleta** *(origem, já existente — OP-03)*: fonte da verdade; litros reais (>0), data, vínculo ao ponto (e por ele ao local). Nenhuma alteração de modelo nesta feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Para qualquer conjunto de coletas, o valor social total retornado é **exatamente** `R$ 1,00 × soma dos litros reais` (erro monetário zero na conferência).
- **SC-002**: A soma dos valores sociais de **todos os locais** e a soma de **todos os meses da série** coincidem com o **total geral** (reconciliação 100%).
- **SC-003**: Um filtro por intervalo de datas retorna exatamente as coletas do intervalo inclusivo — nenhuma coleta fora do intervalo influencia o resultado (verificável com datas de borda).
- **SC-004**: Consultas sem coletas (ou período vazio) retornam sucesso com zeros em 100% dos casos, sem erro.
- **SC-005**: Coletas de locais/pontos arquivados permanecem 100% refletidas no valor social (nenhuma perda por arquivamento).
- **SC-006**: 100% das consultas sem sessão autenticada são recusadas (401); parâmetros de período inválidos são recusados (400) antes de qualquer cálculo.

## Assumptions

- **Depende da OP-03**: a entidade `Coleta` (litros reais, data, vínculo ao ponto/local) já está implementada e disponível em `develop`. Esta feature apenas **lê e agrega**.
- **Sem entidade/persistência nova**: o valor social é calculado sob demanda; não há tabela nem migração de dados novos (a não ser índices de leitura, se necessários, decididos no plano).
- **Backend puro**: a apresentação (painel/tela) é a **IS-02** (Sprint 4) e está **fora de escopo** aqui; a validação desta feature é por testes automatizados e pela API.
- **Taxa fixa**: R$ 1,00 por litro é constante do domínio (RN-G-02); não há configuração de taxa nesta feature.
- **Data da coleta** é o eixo temporal (não a data de criação do registro).
- **Reutiliza a segurança existente**: sessão por cookie, CORS restrito e RLS nas tabelas de origem já implantados nas features anteriores.

### Fora de escopo

- Tela/painel de impacto e qualquer UI (IS-02, Sprint 4).
- Visão do Responsável por local (IS-03).
- Exportação, relatórios, gráficos e visualizações.
- Gamificação e doação **declarada** (trilho distinto — RN-G-01); o cálculo ignora completamente o declarado.
- Configuração/variação da taxa de conversão.
