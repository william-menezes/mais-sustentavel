# Feature Specification: Cadastrar Ponto de Coleta (CA-02)

**Feature Branch**: `003-cadastro-pontos`

**Created**: 2026-07-29

**Status**: Draft

**Input**: História CA-02 — "Como Gestor, quero cadastrar pontos de coleta dentro de um local, para que cada estação tenha seu QR." (backlog `docs/especificacao-detalhada-specs-sustentavel.md` §CA-02; regras transversais §2)

## User Scenarios & Testing *(mandatory)*

Ator único desta feature: **Gestor autenticado** (no MVP, único papel ativo — RN-G-03). Depende da **CA-01** (Local). Todos os textos em português do Brasil (RN-G-13).

### User Story 1 - Cadastrar um ponto com QR único (Priority: P1)

O Gestor escolhe um Local ativo e cadastra um Ponto de coleta nele. No momento do cadastro, o sistema gera um **QR Code único** que identifica aquela estação física. O ponto passa a aparecer na listagem de pontos daquele local.

**Why this priority**: É o núcleo da história — sem criar o ponto e seu QR não há estação física identificável, e nada da operação de coleta (OP-03) ou da futura doação por QR (DG-01) tem onde se ancorar. Entrega valor sozinha.

**Independent Test**: Autenticar como Gestor, escolher um Local ativo, cadastrar um ponto e confirmar que ele é criado com um QR Code único e aparece na listagem do local.

**Acceptance Scenarios**:

1. **Given** um Local existente e ativo, **When** cadastro um ponto nesse local, **Then** o ponto é criado com um QR Code único e aparece na listagem de pontos ativos do local.
2. **Given** um Local ativo, **When** cadastro vários pontos nele, **Then** cada ponto recebe um QR Code distinto dos demais.
3. **Given** um Local **arquivado** (ou inexistente), **When** tento cadastrar um ponto nele, **Then** a operação é bloqueada e nenhum ponto é criado.
4. **Given** que a geração do QR não pôde ser concluída, **When** tento cadastrar o ponto, **Then** o ponto **não** é persistido (não existe ponto sem QR).

---

### User Story 2 - Recuperar o QR de um ponto (exibir e baixar) (Priority: P2)

O Gestor consulta um ponto já cadastrado, visualiza a imagem do seu QR Code e faz o download dela para imprimir e fixar na estação.

**Why this priority**: O QR só tem utilidade se puder ser recuperado e impresso depois do cadastro; sem isto o ponto não vira estação física de fato. Depende do ponto existir (US1).

**Independent Test**: Para um ponto existente, obter a imagem do seu QR (a mesma a cada consulta) e baixá-la em um formato de imagem utilizável.

**Acceptance Scenarios**:

1. **Given** um ponto cadastrado, **When** solicito o QR desse ponto, **Then** recebo a imagem do QR Code correspondente ao seu conteúdo único.
2. **Given** um ponto cadastrado, **When** solicito o QR do mesmo ponto novamente, **Then** obtenho o mesmo QR (estável ao longo do tempo).

---

### User Story 3 - Arquivar e reativar um ponto (Priority: P3)

O Gestor arquiva um ponto que saiu de operação; ele desaparece das listas ativas do local, mas o registro e o histórico são preservados (soft delete — RN-G-06). Quando necessário, o Gestor reativa o ponto.

**Why this priority**: Fecha o ciclo de vida do ponto respeitando a exclusão lógica; não é pré-requisito do valor central (criar ponto + QR). Pode ser entregue por último.

**Independent Test**: Com um ponto ativo, arquivá-lo e confirmar que (a) some da listagem ativa do local e (b) continua consultável entre os arquivados; depois reativá-lo e confirmar que volta aos ativos.

**Acceptance Scenarios**:

1. **Given** um ponto ativo, **When** eu o arquivo, **Then** ele deixa de aparecer nas listas ativas do local, mas seu registro e histórico são preservados.
2. **Given** um ponto que arquivei, **When** consulto os pontos arquivados do local, **Then** ele aparece lá com seus dados preservados.
3. **Given** um ponto arquivado, **When** eu o reativo, **Then** ele volta às listas ativas do local.
4. **Given** um ponto já arquivado, **When** tento arquivá-lo novamente, **Then** a operação é idempotente — permanece arquivado, sem erro nem duplicação.

---

### Edge Cases

- **Local inválido**: criar ponto referenciando um Local inexistente ou arquivado → bloqueado, sem criar o ponto.
- **Falha na geração do QR**: nenhum ponto é persistido sem o seu QR (tudo-ou-nada).
- **Vínculo estável**: o ponto permanece vinculado ao seu local (RN-G-05); a feature não move pontos entre locais.
- **Ponto inexistente**: consultar QR, arquivar ou reativar um ponto que não existe → "não encontrado", sem vazar detalhes.
- **Idempotência de estado**: arquivar um ponto já arquivado (ou reativar um já ativo) não gera erro nem duplica registros.
- **Acesso não autenticado**: qualquer operação sobre pontos sem sessão válida é negada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o Gestor cadastre um Ponto vinculado a um Local **ativo**.
- **FR-002**: No cadastro, o sistema DEVE gerar para o Ponto um **QR Code único**, cujo conteúdo é uma referência (URL do aplicativo) que identifica o ponto — preparando o futuro escaneamento pelo Doador (DG-01), sem implementá-lo aqui.
- **FR-003**: O sistema DEVE bloquear a criação de Ponto quando o Local for **inexistente ou arquivado**; nenhum ponto é criado nesse caso.
- **FR-004**: Se a geração do QR não puder ser concluída, o Ponto **NÃO** DEVE ser persistido (operação atômica: não há ponto sem QR).
- **FR-005**: O sistema DEVE permitir recuperar o QR de um ponto após o cadastro, com **exibição** e **download** da imagem; o QR DEVE ser estável (o mesmo a cada consulta).
- **FR-006**: Um Local PODE ter vários Pontos, e o QR de cada ponto DEVE ser **distinto** dos demais (sem colisão).
- **FR-007**: O sistema DEVE listar os Pontos de um Local, por padrão apenas os **ativos**, oferecendo forma de consultar os **arquivados** separadamente.
- **FR-008**: O sistema DEVE permitir **arquivar** um Ponto (exclusão lógica); um ponto arquivado NÃO aparece nas listas ativas, mas seu registro e histórico são preservados (RN-G-06).
- **FR-009**: O sistema DEVE permitir **reativar** um Ponto previamente arquivado, devolvendo-o às listas ativas.
- **FR-010**: Consultar/arquivar/reativar um Ponto inexistente DEVE resultar em "não encontrado"; as operações de estado (arquivar/reativar) DEVEM ser idempotentes.
- **FR-011**: Todas as operações de Ponto DEVEM exigir sessão autenticada; requisições não autenticadas DEVEM ser negadas. No MVP, apenas o Gestor acessa.
- **FR-012**: As operações que alteram estado (cadastrar, arquivar, reativar) DEVEM ser protegidas contra requisições forjadas de outros sites (CSRF), e a API DEVE aceitar apenas origens conhecidas (CORS restrito).
- **FR-013**: As mensagens de erro NÃO DEVEM expor detalhes internos do sistema.
- **FR-014**: Todos os rótulos, mensagens e textos de interface DEVEM estar em português do Brasil.

### Key Entities *(include if feature involves data)*

- **Ponto**: estação física de coleta dentro de um Local. Atributos: **identificador**, **conteúdo do QR** (referência única que identifica o ponto), **situação de arquivamento** (ativo/arquivado) e o **vínculo com o Local** ao qual pertence. Relaciona-se com **Local em 1:N** (um Local tem vários Pontos; um Ponto pertence a exatamente um Local — RN-G-05). O Ponto não tem rótulo textual próprio no MVP: é identificado pelo seu QR/identificador (ver Assumptions).
- **Local** *(existente — CA-01)*: instituição atendida. Aqui participa apenas como o "pai" ao qual o Ponto se vincula; só Locais **ativos** podem receber novos pontos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Gestor consegue cadastrar um ponto em um local ativo em menos de 1 minuto e ver o QR gerado.
- **SC-002**: 100% dos pontos criados possuem um QR **único** (nenhuma colisão entre pontos).
- **SC-003**: 100% das tentativas de criar ponto em local arquivado ou inexistente são bloqueadas, sem criar registros órfãos.
- **SC-004**: O QR de qualquer ponto é recuperável (exibir/baixar) em 100% dos casos após o cadastro, e idêntico entre consultas.
- **SC-005**: Ao arquivar um ponto, ele desaparece da listagem ativa em 100% dos casos e permanece consultável entre os arquivados; nenhum ponto é apagado fisicamente.
- **SC-006**: 100% das requisições não autenticadas — e das escritas sem prova anti-CSRF válida — são negadas.

## Assumptions

- Reutiliza a fundação da **CA-01/AC-01**: autenticação por sessão (cookie `HttpOnly`), proteção **CSRF** (double-submit) e **CORS** restrito já implantados; e o modelo de Local.
- **Conteúdo do QR** = uma **URL do aplicativo** que identifica o ponto (ex.: `https://<dominio-do-app>/p/{id}`), com a **base configurável por ambiente**; o domínio real é definido no deploy. A resolução dessa URL (fluxo do Doador) é a DG-01, fora daqui.
- A **imagem do QR é gerada no servidor** (definido pela subtarefa do backlog); detalhes técnicos (biblioteca, formato) ficam no plano.
- O **Ponto não possui nome/rótulo** próprio (o backlog modela `Ponto(id, local, qr, arquivado)`); na interface, cada ponto é exibido por uma referência curta derivada do seu identificador e pela data de criação. Um rótulo amigável, se desejado, é evolução futura.
- **Segurança** (Art. 7) materializada no plano: RLS na tabela de Ponto, validação server-side, mensagens genéricas.

## Dependencies

- **CA-01** — cadastro de Local (o Ponto se vincula a um Local ativo).
- **AC-01** — autenticação/sessão e endurecimento CSRF/CORS.

## Out of Scope

- Tela dedicada de **impressão em lote** de QRs (OP-01).
- **Leitura/escaneamento** do QR pelo Doador e **declaração de doação** (DG-01).
- **Geolocalização** do ponto.
- **Registro de coleta / litros** no ponto (OP-03).
- Exclusão física (hard delete) de pontos — proibida pela RN-G-06.
