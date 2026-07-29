# Feature Specification: Cadastrar Local (CA-01)

**Feature Branch**: `002-cadastro-locais`

**Created**: 2026-07-29

**Status**: Draft

**Input**: História CA-01 — "Como Gestor, quero cadastrar locais, para organizar a operação por instituição." (backlog `docs/especificacao-detalhada-specs-sustentavel.md` §CA-01; regras transversais §2)

## User Scenarios & Testing *(mandatory)*

Ator único desta feature: **Gestor autenticado** (no MVP, único papel ativo — RN-G-03). Todos os textos em português do Brasil (RN-G-13).

### User Story 1 - Cadastrar um local (Priority: P1)

O Gestor informa nome, tipo e endereço de uma instituição atendida (ex.: um condomínio) e a salva. O local passa a aparecer imediatamente na listagem de locais ativos, pronto para receber pontos de coleta em etapas futuras.

**Why this priority**: É o núcleo da história — sem cadastrar e ver o local ativo, nada mais da operação (pontos, coletas, impacto) tem onde se apoiar. Entrega valor sozinha e é a base das demais features de cadastro.

**Independent Test**: Autenticar como Gestor, cadastrar um local com nome, tipo e endereço válidos e confirmar que ele aparece na listagem de ativos.

**Acceptance Scenarios**:

1. **Given** que estou autenticado como Gestor, **When** cadastro um local informando nome, tipo e endereço, **Then** o local é salvo e aparece na listagem de locais ativos.
2. **Given** que estou cadastrando um local, **When** deixo de informar o nome, o tipo ou o endereço, **Then** o cadastro é impedido e recebo uma mensagem de validação indicando o campo obrigatório.
3. **Given** que estou cadastrando um local, **When** informo um tipo fora da lista permitida (condomínio, escola, empresa, espaço público, outro), **Then** o cadastro é impedido com mensagem de validação.

---

### User Story 2 - Arquivar um local (Priority: P2)

O Gestor arquiva um local que não está mais em operação. Ele desaparece das listas ativas, mas o registro e todo o histórico/valor social gerado são preservados (exclusão lógica — RN-G-06).

**Why this priority**: Fecha o ciclo de vida do cadastro respeitando a regra transversal de soft delete; sem ela, listas ativas acumulam locais inativos e o histórico ficaria em risco. Depende do cadastro (US1) existir.

**Independent Test**: Com um local ativo previamente cadastrado, arquivá-lo e confirmar que (a) some da listagem ativa e (b) continua consultável na visão de arquivados, com seus dados intactos.

**Acceptance Scenarios**:

1. **Given** um local ativo existente, **When** eu o arquivo, **Then** ele deixa de aparecer nas listas ativas.
2. **Given** um local que arquivei, **When** consulto os locais arquivados, **Then** ele aparece lá com seus dados preservados, e seu histórico e valor social gerado permanecem intactos.
3. **Given** um local já arquivado, **When** tento arquivá-lo novamente, **Then** a operação é idempotente — ele permanece arquivado, sem erro nem duplicação.

---

### User Story 3 - Editar e reativar um local (Priority: P3)

O Gestor corrige os dados de um local (nome, tipo ou endereço) e, quando necessário, reativa um local previamente arquivado para trazê-lo de volta às listas ativas.

**Why this priority**: Completa o CRUD da história e a gestão do estado de arquivamento, mas não é pré-requisito para o valor central (cadastrar e organizar). Pode ser entregue por último.

**Independent Test**: Editar um local existente e confirmar a persistência das alterações com as mesmas validações do cadastro; reativar um local arquivado e confirmar que volta à listagem ativa.

**Acceptance Scenarios**:

1. **Given** um local existente, **When** altero seu nome, tipo ou endereço com valores válidos, **Then** as alterações são salvas e refletidas na listagem.
2. **Given** que estou editando um local, **When** informo dados inválidos (campo obrigatório vazio ou tipo fora da lista), **Then** a alteração é impedida com a mesma validação do cadastro.
3. **Given** um local arquivado, **When** eu o reativo, **Then** ele volta a aparecer nas listas ativas com seus dados preservados.

---

### Edge Cases

- **Espaços em branco**: nome ou endereço contendo apenas espaços são tratados como ausentes e reprovados na validação.
- **Tipo inválido**: valor de tipo fora da lista fechada é rejeitado (não há tipo "livre").
- **Local inexistente**: editar, arquivar ou reativar um local que não existe resulta em "não encontrado", sem expor detalhes internos.
- **Idempotência de estado**: arquivar um local já arquivado (ou reativar um já ativo) não gera erro nem duplica registros.
- **Nomes homônimos**: dois locais podem ter o mesmo nome (ex.: duas escolas "Municipal"); o nome não é identificador único.
- **Acesso não autenticado**: qualquer operação sobre locais sem sessão válida é negada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir que o Gestor cadastre um Local informando nome, tipo e endereço.
- **FR-002**: O sistema DEVE exigir nome, tipo e endereço no cadastro; a ausência de qualquer um deles impede o salvamento e produz mensagem de validação apontando o campo.
- **FR-003**: O sistema DEVE restringir o tipo do Local a uma lista fechada: condomínio, escola, empresa, espaço público, outro.
- **FR-004**: Após um cadastro bem-sucedido, o Local DEVE aparecer imediatamente na listagem de locais ativos.
- **FR-005**: O sistema DEVE permitir arquivar um Local (exclusão lógica); um Local arquivado NÃO DEVE aparecer nas listagens ativas.
- **FR-006**: Arquivar um Local DEVE preservar integralmente seu registro e o histórico/valor social a ele associado — nenhum dado é removido fisicamente (RN-G-06).
- **FR-007**: O sistema DEVE permitir editar nome, tipo e endereço de um Local existente, aplicando as mesmas validações do cadastro (FR-002, FR-003).
- **FR-008**: O sistema DEVE, por padrão, listar apenas locais ativos e DEVE oferecer uma forma de consultar os locais arquivados separadamente, sem que estes poluam a lista ativa.
- **FR-009**: O sistema DEVE permitir reativar (desarquivar) um Local previamente arquivado, devolvendo-o às listagens ativas com seus dados preservados.
- **FR-010**: As operações de arquivar, reativar e editar sobre um Local inexistente DEVEM resultar em "não encontrado", e as de estado (arquivar/reativar) DEVEM ser idempotentes.
- **FR-011**: Todas as operações de Local (cadastrar, editar, listar, arquivar, reativar) DEVEM exigir uma sessão autenticada; requisições não autenticadas DEVEM ser negadas. No MVP, apenas o Gestor acessa.
- **FR-012**: As mensagens de erro NÃO DEVEM expor detalhes internos do sistema (pilhas de erro, SQL, estrutura interna).
- **FR-013**: Todos os rótulos, mensagens e textos de interface DEVEM estar em português do Brasil.
- **FR-014**: As operações que alteram estado (cadastrar, editar, arquivar, reativar) DEVEM ser protegidas contra requisições forjadas a partir de outros sites (CSRF); uma requisição de escrita sem prova de origem legítima do cliente DEVE ser rejeitada.
- **FR-015**: A API DEVE aceitar requisições apenas de origens conhecidas e autorizadas (CORS restrito), permitindo o envio das credenciais de sessão apenas a essas origens.

### Key Entities *(include if feature involves data)*

- **Local**: instituição atendida pela operação. Atributos: **nome** (texto obrigatório), **tipo** (um valor da lista fechada: condomínio, escola, empresa, espaço público, outro), **endereço** (texto obrigatório, livre) e **situação de arquivamento** (ativo ou arquivado). Um Local virá a possuir pontos de coleta em feature futura (CA-02), mas esse relacionamento está **fora do escopo** aqui. O nome não é único.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Gestor consegue cadastrar um novo local (nome, tipo, endereço) em menos de 1 minuto e vê-lo na listagem ativa sem recarregar manualmente a página.
- **SC-002**: 100% das tentativas de cadastro/edição sem nome, tipo ou endereço — ou com tipo fora da lista — são bloqueadas com mensagem de validação clara.
- **SC-003**: Ao arquivar um local, ele desaparece da listagem ativa em 100% dos casos e permanece consultável na visão de arquivados.
- **SC-004**: Nenhum dado é perdido ao arquivar: em 100% dos casos o registro e o histórico/valor social associado permanecem íntegros e recuperáveis.
- **SC-005**: 100% das requisições não autenticadas a qualquer operação de Local são negadas.
- **SC-006**: 100% das requisições de escrita (cadastrar/editar/arquivar/reativar) sem prova anti-CSRF válida são rejeitadas, e requisições de origens não autorizadas são bloqueadas.

## Assumptions

- Reutiliza a autenticação e o modelo de papéis entregues na **AC-01**; no MVP apenas o Gestor está ativo, portanto autorização por papel/escopo (AC-04) não é aplicada aqui além de exigir sessão autenticada.
- **Reativar (desarquivar)** é suportado como parte natural da gestão do arquivamento (decisão a confirmar no plano; a história cita apenas "arquivar", mas o CRUD e a usabilidade justificam a reativação).
- **Endereço** é um único campo de texto livre (sem validação de CEP, sem geocodificação) — coerente com `Local(id, nome, tipo, endereco, arquivado)` do backlog.
- O **nome do local não é único**: instituições homônimas são permitidas.
- A listagem é **simples** (ativos por padrão + visão de arquivados); busca, ordenação avançada e paginação dedicadas pertencem à VH-01 (fora de escopo).
- Segurança (Art. 7) será materializada no plano: proteção de dados em repouso no banco (RLS na tabela de Local), validação de entrada no servidor e mensagens genéricas — sem enumerar/expor detalhes.
- Por introduzir os **primeiros endpoints de escrita autenticados**, esta feature também **endurece a autenticação existente (AC-01)**: mantém a sessão por cookie (que já é `HttpOnly`) e adiciona **proteção anti-CSRF** (token double-submit) e **CORS restrito**. Não há migração de mecanismo (a sessão é preservada); a proteção por papel/escopo (só Gestor, filtro por local) segue como AC-04.

## Dependencies

- **AC-01** — autenticação (sessão) e papéis já implantados. Sem login válido de Gestor, nenhuma operação desta feature é acessível.

## Out of Scope

- Cadastro de **pontos de coleta** e geração de **QR Code** (CA-02).
- **Vínculo de Responsável** a Local (CA-04) e controle de acesso por escopo/multi-papel (AC-04).
- **Listagem/visualizações dedicadas avançadas** (busca, filtros, paginação) — VH-01.
- Exclusão física (hard delete) de locais — proibida pela RN-G-06.
