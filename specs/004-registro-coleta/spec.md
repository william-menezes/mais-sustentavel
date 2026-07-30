# Feature Specification: Registrar Coleta (OP-03)

**Feature Branch**: `004-registro-coleta`

**Created**: 2026-07-30

**Status**: Draft

**Input**: História OP-03 — "Como Gestor/Coletor, quero registrar os litros reais recolhidos num ponto, para alimentar o valor social." (backlog `docs/especificacao-detalhada-specs-sustentavel.md` §OP-03; regras transversais §2)

## User Scenarios & Testing *(mandatory)*

Ator: **Gestor autenticado** (podendo acumular Coletor; no MVP só o Gestor é ativo — RN-G-03). Depende da **CA-02** (Ponto). Textos em pt-BR (RN-G-13). Versão **simplificada**: registro direto, sem solicitação prévia nem estados.

### User Story 1 - Registrar uma coleta num ponto (Priority: P1)

O Gestor seleciona um ponto de coleta e registra a medição real: os **litros reais** recolhidos e a **data** da coleta. A coleta fica associada ao ponto e passa a compor o total de litros recolhidos daquele ponto — a base do valor social (RN-G-01/RN-G-02).

**Why this priority**: É o núcleo — a medição real é o que alimenta o impacto (valor social, calculado na IS-01). Sem o registro da coleta, não há o que medir. Entrega valor sozinha.

**Independent Test**: Autenticar como Gestor, registrar uma coleta num ponto existente com litros > 0 e uma data válida, e confirmar que ela fica associada ao ponto e entra no total de litros.

**Acceptance Scenarios**:

1. **Given** um ponto existente, **When** registro uma coleta informando os litros reais e a data, **Then** a coleta fica associada ao ponto e entra no total de litros recolhidos.
2. **Given** que estou registrando uma coleta, **When** informo litros iguais ou menores que zero, **Then** o sistema recusa o registro.
3. **Given** que estou registrando uma coleta, **When** informo uma data ausente ou no futuro, **Then** o sistema recusa o registro.
4. **Given** um ponto inexistente, **When** tento registrar uma coleta nele, **Then** a operação é bloqueada e nada é registrado.
5. **Given** um ponto arquivado, **When** tento registrar uma coleta nele, **Then** a operação é bloqueada (um ponto arquivado não recebe novas coletas).

---

### User Story 2 - Consultar as coletas e o total de um ponto (Priority: P2)

O Gestor consulta as coletas já registradas num ponto (data, litros, e quem registrou) e vê o **total de litros recolhidos** daquele ponto.

**Why this priority**: Dá visibilidade da medição acumulada e confirma que os registros entraram no total; base para o painel de impacto (IS-02, backlog). Depende de existir registro (US1).

**Independent Test**: Com coletas registradas num ponto, listar as coletas e conferir que o total de litros exibido é a soma exata delas.

**Acceptance Scenarios**:

1. **Given** um ponto com coletas registradas, **When** consulto suas coletas, **Then** vejo cada coleta (data, litros, quem registrou) e o total de litros.
2. **Given** um ponto sem coletas, **When** consulto suas coletas, **Then** a lista vem vazia e o total é zero (não é erro).

---

### Edge Cases

- **Litros inválidos**: valor ≤ 0 (ou não numérico) → registro recusado.
- **Data inválida**: ausente, malformada ou no futuro → registro recusado.
- **Ponto inexistente**: registrar coleta num ponto que não existe → bloqueado, nada registrado.
- **Ponto arquivado**: **não recebe novas coletas** (registro bloqueado); porém suas coletas históricas continuam **consultáveis** (o arquivamento preserva o histórico — RN-G-06).
- **Imutabilidade**: uma coleta registrada é um dado de medição — não é editada nem removida no MVP.
- **Acesso não autenticado**: qualquer operação sem sessão válida é negada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir registrar uma Coleta associada a um Ponto existente, informando **litros reais** e **data**.
- **FR-002**: O sistema DEVE exigir **litros reais > 0**; valores ≤ 0 ou não numéricos DEVEM ser recusados.
- **FR-003**: O sistema DEVE exigir uma **data** válida e **não futura**; data ausente/inválida/futura DEVE ser recusada.
- **FR-004**: Registrar coleta exige um **Ponto existente e ativo**; Ponto **inexistente** ou **arquivado** DEVE ser bloqueado, sem persistir nada (um ponto arquivado não recebe novas coletas; seu histórico continua consultável).
- **FR-005**: Uma coleta registrada DEVE ficar associada ao seu Ponto e compor o **total de litros recolhidos** do ponto.
- **FR-006**: O sistema DEVE registrar (opcionalmente) **quem realizou/registrou** a coleta; no MVP, o usuário autenticado que registrou (auditoria), com o campo preparado para o papel Coletor (AC-03).
- **FR-007**: O sistema DEVE permitir listar as coletas de um Ponto (data, litros, quem registrou) e apresentar o **total de litros** do ponto (zero quando não houver coletas).
- **FR-008**: Uma coleta é um registro de medição **imutável** no MVP — não DEVE ser editável nem removível (append-only; não há exclusão lógica para coleta).
- **FR-009**: Toda quantidade é em **litros** (RN-G-12); a medição real é a base do valor social (RN-G-02) — cujo cálculo em reais e agregação por local/período é a **IS-01**, fora desta feature.
- **FR-010**: Todas as operações DEVEM exigir sessão autenticada; as escritas DEVEM ser protegidas contra CSRF e a API DEVE aceitar apenas origens conhecidas (CORS).
- **FR-011**: As mensagens de erro NÃO DEVEM expor detalhes internos.
- **FR-012**: Todos os textos de interface DEVEM estar em português do Brasil.

### Key Entities *(include if feature involves data)*

- **Coleta**: registro de uma retirada física de óleo, com a medição real. Atributos: **identificador**, **litros reais** (número positivo, em litros), **data** (dia da coleta, não futura), **quem registrou** (opcional — usuário/coletor) e o **vínculo com o Ponto**. Relaciona-se com **Ponto em N:1** (um Ponto tem várias Coletas). É **imutável** após criada.
- **Ponto** *(existente — CA-02)*: participa como o "pai" ao qual a Coleta se vincula; o total de litros de um ponto é a soma das suas coletas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Gestor registra uma coleta (litros + data) em menos de 1 minuto e a vê refletida no total do ponto.
- **SC-002**: 100% dos registros com litros ≤ 0 ou data ausente/futura são recusados com mensagem clara.
- **SC-003**: O total de litros de um ponto é sempre igual à soma exata dos litros das suas coletas.
- **SC-004**: 100% das tentativas de registrar coleta em ponto inexistente ou arquivado são bloqueadas, sem criar registros órfãos.
- **SC-005**: Nenhuma coleta é alterada ou removida após registrada (integridade da medição).
- **SC-006**: 100% das requisições não autenticadas — e das escritas sem prova anti-CSRF — são negadas.

## Assumptions

- Reutiliza a **CA-02** (Ponto) e a fundação de **AC-01** (autenticação por sessão, CSRF double-submit, CORS).
- **Litros reais** é um número **decimal positivo** (permite frações, ex.: 12,5 L).
- **Data** é uma data (sem hora), informada pelo Gestor, **não futura** (a coleta pode ser de um dia anterior).
- **Quem registrou** = o **usuário autenticado** que fez o registro (auditoria; confirmado). O campo é modelado como opcional e preparado para o papel Coletor (AC-03).
- **Registrar em ponto arquivado**: **bloqueado** (decisão do usuário) — um ponto arquivado não recebe novas coletas; a consulta do histórico continua permitida.
- Coleta é **append-only** — sem editar/arquivar (não consta na RN-G-06).
- Segurança (Art. 7) materializada no plano: RLS na tabela de Coleta, validação server-side, mensagens genéricas.

## Dependencies

- **CA-02** — Ponto (a Coleta se vincula a um Ponto).
- **AC-01** — autenticação/sessão e endurecimento CSRF/CORS.

## Out of Scope

- Fluxo de **solicitação** de coleta (OP-02) e **máquina de estados** (OP-04).
- **Reconciliação** declarado × medido (OP-05).
- **Valor social em R$** e **agregação por local/período** (IS-01); **painel de impacto** (IS-02).
- Edição/remoção de coletas; histórico dedicado do Responsável (VH-04).
