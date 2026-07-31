# Feature Specification: Endereço estruturado e visão geral de Locais (CA-01 · VH-01)

**Feature Branch**: `006-endereco-estruturado-locais`

**Created**: 2026-07-31

**Status**: Draft

**Input**: Evolução da história **CA-01** ("Como Gestor, quero cadastrar locais, para organizar a operação por instituição") com endereço estruturado, somada à história **VH-01** ("Como Gestor, quero listar todos os locais, para ter visão geral" — backlog `docs/especificacao-detalhada-specs-sustentavel.md` §VH-01). Regras transversais §2.

## User Scenarios & Testing *(mandatory)*

Ator único desta feature: **Gestor autenticado** (no MVP, único papel ativo — RN-G-03). Todos os textos em português do Brasil (RN-G-13).

### User Story 1 - Cadastrar um local com endereço estruturado (Priority: P1)

O Gestor informa o endereço da instituição em campos separados — CEP, rua, número, complemento, bairro, cidade e UF — em vez de uma única linha de texto livre. O complemento é o único campo opcional. Ao editar um local, os campos voltam preenchidos separadamente, prontos para correção pontual.

**Why this priority**: É a mudança de fundo desta feature. Endereço em texto livre não permite conferir, comparar nem detectar o mesmo prédio cadastrado duas vezes — e é dado que, uma vez sujo, só piora com o volume. Todo o resto da feature se apoia neste modelo.

**Independent Test**: Autenticar como Gestor, cadastrar um local informando os sete campos de endereço e confirmar que ele aparece na lista; reabrir o mesmo local para edição e confirmar que cada campo volta no seu lugar.

**Acceptance Scenarios**:

1. **Dado** que estou autenticado como Gestor, **Quando** cadastro um local informando nome, tipo, CEP, rua, número, bairro, cidade e UF, **Então** o local é salvo e passa a aparecer na lista de locais.
2. **Dado** que estou cadastrando um local, **Quando** deixo o complemento em branco e preencho todos os demais campos, **Então** o cadastro é aceito.
3. **Dado** que estou cadastrando um local, **Quando** deixo em branco qualquer campo obrigatório (nome, tipo, CEP, rua, número, bairro, cidade ou UF), **Então** o cadastro é impedido e o campo pendente é indicado.
4. **Dado** um local já cadastrado, **Quando** abro sua edição, **Então** cada componente do endereço aparece no seu próprio campo, com o valor atual.
5. **Dado** que estou editando um local, **Quando** altero apenas o número e salvo, **Então** somente aquele componente muda e os demais permanecem intactos.
6. **Dado** que informo um CEP com quantidade de dígitos diferente da esperada, **Quando** tento salvar, **Então** o cadastro é impedido com indicação de CEP inválido.
7. **Dado** que estou cadastrando um local, **Quando** informo uma UF fora da lista das unidades federativas brasileiras, **Então** o cadastro é impedido com mensagem de validação.

---

### User Story 2 - Ter visão geral dos locais e encontrar um deles (Priority: P2)

O Gestor abre a lista de locais e vê, para cada um, o nome com o endereço resumido, o tipo, o total de litros já recolhidos nos seus pontos e a situação (ativo ou arquivado). Ativos e arquivados convivem na mesma lista, e o Gestor filtra por qualquer coluna exibida, com critérios apropriados ao tipo do dado. Por padrão, a lista mostra apenas os ativos (RN-G-06), informando quantos locais estão sendo exibidos em relação ao total cadastrado.

**Why this priority**: É a entrega da VH-01. Com dezenas de locais, perguntas do dia a dia — "quais escolas estão arquivadas", "quais locais passaram de mil litros" — hoje exigem varrer a lista com o olho. Entrega valor sozinha, mesmo sem a US1.

**Independent Test**: Com locais ativos e arquivados cadastrados, abrir a lista e confirmar que só os ativos aparecem por padrão e que a contagem exibida reflete exibidos/total; aplicar filtro por tipo, por litros e por situação e confirmar o resultado em cada caso.

**Acceptance Scenarios**:

1. **Dado** que existem locais ativos e arquivados, **Quando** abro a lista de locais, **Então** vejo apenas os ativos e a indicação de quantos locais estão sendo exibidos em relação ao total.
2. **Dado** que estou na lista, **Quando** filtro a situação por "arquivado", **Então** passo a ver somente os locais arquivados.
3. **Dado** que estou na lista, **Quando** filtro o tipo por "escola", **Então** vejo somente os locais desse tipo.
4. **Dado** que estou na lista, **Quando** filtro os litros por um valor mínimo, **Então** vejo somente os locais que alcançaram ou passaram desse volume.
5. **Dado** que estou na lista, **Quando** filtro o nome por parte de uma palavra, **Então** vejo os locais cujo nome contém aquele trecho.
6. **Dado** um filtro aplicado que não corresponde a nenhum local, **Quando** a lista é atualizada, **Então** recebo uma mensagem de lista vazia e a possibilidade de limpar o filtro.
7. **Dado** um local sem nenhuma coleta registrada, **Quando** vejo a lista, **Então** seus litros aparecem como zero, não em branco.

---

### User Story 3 - Preencher o endereço a partir do CEP (Priority: P3)

Ao informar o CEP, o Gestor tem rua, bairro, cidade e UF preenchidos automaticamente por consulta a serviço público de endereçamento, restando digitar o número e, se houver, o complemento. Os campos preenchidos continuam editáveis. Quando o CEP não é encontrado, ou quando o serviço não responde, o Gestor preenche tudo manualmente — a consulta é uma conveniência, nunca uma dependência para cadastrar.

**Why this priority**: Reduz digitação e erro de grafia justamente no dado que mais se repete entre locais do mesmo bairro. É melhoria sobre a US1, não pré-requisito dela.

**Independent Test**: Informar um CEP existente e confirmar que rua, bairro, cidade e UF chegam preenchidos; informar um CEP inexistente e confirmar que o cadastro segue possível preenchendo à mão; simular indisponibilidade do serviço e confirmar que nada é bloqueado.

**Acceptance Scenarios**:

1. **Dado** que estou cadastrando um local, **Quando** informo um CEP existente, **Então** rua, bairro, cidade e UF são preenchidos automaticamente e resta informar o número.
2. **Dado** que o CEP trouxe os dados automaticamente, **Quando** corrijo manualmente a rua, **Então** minha correção é preservada e é ela que será salva.
3. **Dado** que estou cadastrando um local, **Quando** informo um CEP que não existe na base pública, **Então** sou avisado de que não foi encontrado e posso preencher rua, bairro, cidade e UF manualmente.
4. **Dado** que o serviço público de CEP está indisponível ou demora demais, **Quando** informo um CEP, **Então** sou avisado de que a consulta falhou e sigo com o cadastro preenchendo os campos manualmente.
5. **Dado** que preenchi o endereço por CEP, **Quando** troco o CEP por outro válido, **Então** rua, bairro, cidade e UF são atualizados conforme o novo endereço.

---

### User Story 4 - Cadastrar e editar sem perder a lista de vista (Priority: P3)

O cadastro e a edição acontecem num painel sobreposto à lista, que preserva o contexto: título do formulário, trilha de navegação e botões de ação permanecem visíveis enquanto o Gestor rola os campos. Em telas estreitas o painel ocupa a largura disponível. O botão de salvar só fica disponível quando os campos obrigatórios estão preenchidos.

**Why this priority**: Qualidade de uso, não capacidade nova — o cadastro funcionaria numa janela modal comum. Ganha relevância porque o formulário passou de três para nove campos e vai crescer nas telas seguintes.

**Independent Test**: Abrir o cadastro a partir da lista e confirmar que a lista continua visível atrás; rolar o formulário e confirmar que título, trilha e botões não saem da tela; verificar que o botão de salvar só habilita com os obrigatórios preenchidos; repetir numa viewport estreita.

**Acceptance Scenarios**:

1. **Dado** que estou na lista de locais, **Quando** aciono o cadastro de um novo local, **Então** um painel se abre sobre a lista, com a trilha de navegação e o título do formulário.
2. **Dado** que o painel está aberto com o formulário mais alto que a área visível, **Quando** rolo o conteúdo, **Então** título, trilha e botões permanecem visíveis.
3. **Dado** que o painel está aberto e há campo obrigatório em branco, **Quando** observo os botões, **Então** o de salvar está indisponível.
4. **Dado** que preenchi todos os obrigatórios, **Quando** observo os botões, **Então** o de salvar está disponível.
5. **Dado** que estou em tela estreita, **Quando** abro o cadastro, **Então** o painel ocupa a largura disponível e o formulário é utilizável sem rolagem horizontal.
6. **Dado** que preenchi campos e desisto, **Quando** aciono cancelar, **Então** o painel fecha sem salvar e a lista permanece como estava.

---

### Edge Cases

- **Espaços em branco**: campos obrigatórios contendo apenas espaços são tratados como ausentes e reprovados.
- **CEP mal formado**: quantidade de dígitos diferente da esperada é rejeitada antes de qualquer consulta.
- **CEP válido em formato, inexistente na base**: cadastro segue possível com preenchimento manual.
- **Serviço de CEP fora do ar ou lento**: nunca impede o cadastro; o Gestor é avisado e assume o preenchimento.
- **UF fora da lista**: sigla inexistente é rejeitada; não há UF "livre".
- **Número sem numeração**: imóveis sem número precisam de uma forma de registro (ex.: "s/n"), portanto o número não é tratado como valor estritamente numérico.
- **Endereços já cadastrados em texto livre**: precisam de destino definido na transição; nenhum endereço existente pode ser perdido.
- **Local sem coletas**: litros exibidos como zero, nunca em branco.
- **Filtro sem resultados**: mensagem de lista vazia distinta da mensagem de "nenhum local cadastrado".
- **Local inexistente**: editar ou arquivar um local que não existe resulta em "não encontrado", sem expor detalhes internos.
- **Nomes homônimos**: continuam permitidos; nem nome nem endereço são identificadores únicos (dois locais podem dividir o mesmo endereço, ex.: dois blocos).
- **Acesso não autenticado**: qualquer operação sobre locais sem sessão válida é negada.

## Requirements *(mandatory)*

### Functional Requirements

**Endereço estruturado**

- **FR-001**: O sistema DEVE registrar o endereço de um Local em componentes distintos: CEP, rua, número, complemento, bairro, cidade e UF.
- **FR-002**: O sistema DEVE exigir CEP, rua, número, bairro, cidade e UF, além de nome e tipo; o complemento DEVE ser opcional.
- **FR-003**: O sistema DEVE validar o formato do CEP (oito dígitos) e rejeitar valores fora desse formato.
- **FR-004**: O sistema DEVE restringir a UF a uma lista fechada das unidades federativas brasileiras, identificadas pela sigla de duas letras.
- **FR-005**: A interface DEVE apresentar o CEP em formato legível de leitura e digitação, deixando claro o padrão esperado.
- **FR-006**: O sistema DEVE tratar o número do imóvel como texto, admitindo registros como "s/n" ou "120A".
- **FR-007**: O sistema DEVE permitir editar qualquer componente do endereço isoladamente, aplicando as mesmas validações do cadastro.
- **FR-008**: A transição para o endereço estruturado NÃO DEVE perder nenhum endereço já cadastrado; o conteúdo atual em texto livre DEVE ter destino explícito e verificável.
- **FR-009**: As validações de obrigatoriedade e formato DEVEM ser aplicadas no servidor, independentemente do que a interface já tenha verificado.

**Preenchimento por CEP**

- **FR-010**: Ao receber um CEP com formato válido, o sistema DEVE consultar serviço público de endereçamento e preencher rua, bairro, cidade e UF a partir do resultado.
- **FR-011**: Os campos preenchidos automaticamente DEVEM permanecer editáveis, e a alteração feita pelo Gestor DEVE prevalecer sobre o valor consultado.
- **FR-012**: Quando o CEP não for encontrado, o sistema DEVE informar o Gestor e permitir o preenchimento manual de todos os campos.
- **FR-013**: Quando a consulta falhar ou exceder um tempo razoável de espera, o sistema DEVE informar o Gestor e permitir o preenchimento manual — a indisponibilidade do serviço externo NUNCA DEVE impedir o cadastro de um Local.
- **FR-014**: Ao substituir o CEP por outro válido, o sistema DEVE atualizar rua, bairro, cidade e UF conforme o novo endereço.

**Visão geral e filtros**

- **FR-015**: A lista de Locais DEVE exibir, por local: nome com o endereço resumido, tipo, total de litros reais recolhidos nos seus pontos e situação (ativo ou arquivado).
- **FR-016**: Cada coluna exibida DEVE oferecer filtro com critérios de comparação adequados ao tipo do dado — texto para nome, escolha em lista fechada para tipo e situação, comparação por valor para litros.
- **FR-017**: A lista DEVE reunir locais ativos e arquivados, e a situação DEVE ser filtrável como qualquer outra coluna.
- **FR-018**: Por padrão, a lista DEVE apresentar apenas os locais ativos (RN-G-06); o Gestor DEVE poder alterar esse filtro para ver arquivados ou o conjunto completo.
- **FR-019**: A lista DEVE informar quantos locais estão sendo exibidos em relação ao total cadastrado.
- **FR-020**: Locais sem nenhuma coleta registrada DEVEM exibir zero litros, nunca valor vazio.
- **FR-021**: Quando um filtro não retornar resultados, o sistema DEVE exibir mensagem própria de "nenhum resultado para o filtro", distinta da mensagem de lista sem nenhum cadastro.

**Cadastro sobreposto à lista**

- **FR-022**: O cadastro e a edição de um Local DEVEM ocorrer em painel sobreposto à lista, sem navegar para outra tela.
- **FR-023**: O painel DEVE manter título do formulário, trilha de navegação e botões de ação permanentemente visíveis enquanto o conteúdo do formulário é rolado.
- **FR-024**: Em telas estreitas, o painel DEVE ocupar a largura disponível e o formulário DEVE ser utilizável sem rolagem horizontal.
- **FR-025**: O acionamento de salvar DEVE estar indisponível enquanto houver campo obrigatório não preenchido.
- **FR-026**: Cancelar o painel DEVE descartar o preenchimento sem alterar o Local nem a lista.

**Transversais**

- **FR-027**: Todos os rótulos, mensagens e textos de interface DEVEM estar em português do Brasil (RN-G-13).
- **FR-028**: Todas as operações de Local DEVEM exigir sessão autenticada; requisições não autenticadas DEVEM ser negadas.
- **FR-029**: As operações que alteram estado DEVEM permanecer protegidas contra requisições forjadas de outros sites (CSRF), como já estabelecido na CA-01.
- **FR-030**: As mensagens de erro NÃO DEVEM expor detalhes internos do sistema, inclusive as originadas na consulta ao serviço externo de CEP.
- **FR-031**: O endereço detalhado NÃO DEVE ser exposto em nenhuma superfície pública por esta feature; a regra de privacidade de endereço em locais privados pertence à LP-01d.

### Key Entities *(include if feature involves data)*

- **Local**: instituição atendida pela operação. Atributos: **nome** (texto obrigatório), **tipo** (lista fechada: condomínio, escola, empresa, espaço público, outro), **endereço** — agora decomposto em **CEP**, **rua**, **número**, **complemento** (opcional), **bairro**, **cidade** e **UF** (lista fechada das unidades federativas) — e **situação de arquivamento** (ativo ou arquivado). Nome e endereço não são identificadores únicos.
- **Litros recolhidos por local**: grandeza derivada, somatório dos litros reais das coletas dos pontos do local. Não é atributo do Local: é leitura calculada, já disponível na visão de impacto (IS-01), exibida aqui por conveniência do Gestor. Segue o trilho de medição real (RN-G-01 / Art. 2.1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Gestor cadastra um local com endereço completo em menos de 1 minuto.
- **SC-002**: Com CEP encontrado, o Gestor digita manualmente no máximo dois componentes do endereço (número e complemento) — os outros quatro chegam preenchidos.
- **SC-003**: 100% das tentativas de salvar com campo obrigatório em branco são impedidas antes do envio.
- **SC-004**: 100% dos cadastros permanecem concluíveis quando o serviço público de CEP está indisponível.
- **SC-005**: 100% dos endereços já cadastrados continuam recuperáveis após a transição para o modelo estruturado.
- **SC-006**: O Gestor responde "quais escolas estão arquivadas" com no máximo duas aplicações de filtro, sem varrer a lista visualmente.
- **SC-007**: Ao abrir a lista, 100% dos locais exibidos por padrão estão ativos.
- **SC-008**: O formulário de cadastro é utilizável sem rolagem horizontal em telas a partir de 360 px de largura.
- **SC-009**: Ao rolar o formulário até o fim, título e botões de ação continuam visíveis em 100% das interações.

## Assumptions

- **Endereçamento brasileiro apenas.** O modelo assume CEP e UF do Brasil; endereços internacionais não são contemplados e não estão previstos no produto.
- **Serviço público de CEP** é consultado como conveniência de preenchimento. Não é fonte de verdade: o que vale é o que foi salvo, e o cadastro nunca depende dele (FR-013).
- **Sem geocodificação nem mapa.** Coordenadas e exibição em mapa pertencem à LP-01d.
- **Endereços legados**: o ambiente de produção ainda não tem locais cadastrados, então a transição tende a ser trivial. Mesmo assim FR-008 exige destino explícito para o texto livre, porque o ambiente de desenvolvimento tem dados e a migração precisa ser determinística em qualquer base.
- **Litros por local** reutiliza o cálculo já entregue na IS-01, sem redefinir a regra de valor social nesta feature.
- **Filtragem sobre o conjunto carregado.** O volume esperado é de dezenas de locais; a filtragem não exige paginação sob demanda no servidor. Se o volume crescer uma ordem de magnitude, a estratégia é revista em história própria.
- **A situação continua sendo ativo ou arquivado.** Nenhum estado intermediário é introduzido.
- Reutiliza a autenticação, o modelo de papéis e a proteção anti-CSRF já entregues (AC-01, CA-01).

## Dependencies

- **CA-01** (feature `002-cadastro-locais`) — cadastro, edição, arquivamento e reativação de Local já implantados. Esta feature altera o modelo de endereço e a listagem construídos lá.
- **IS-01** (feature `005-valor-social`) — cálculo de litros reais agregados por local, reaproveitado na coluna de litros.
- **Serviço público de consulta de CEP** — dependência externa, deliberadamente não crítica (FR-013).

## Out of Scope

- **Número de pontos de coleta por local** na lista. A VH-01 menciona esse dado, mas ele exige um agregado que a API não expõe hoje; fica para história própria. **Esta feature entrega a VH-01 parcialmente** — nome, tipo, litros e situação, sem a contagem de pontos.
- **Refatoração das telas de Pontos de coleta e Coletas.** Os padrões de lista filtrável e de painel de cadastro estabelecidos aqui serão reaproveitados nessas telas em histórias seguintes.
- **Seleção de registro relacionado com criação sobreposta** (escolher um Local ao cadastrar um Ponto, criando o Local sem sair do fluxo). O padrão foi definido junto com esta feature, mas Local não possui campo derivado — sua primeira aplicação é na tela de Pontos.
- **Geocodificação, mapa público e privacidade de endereço em locais privados** (LP-01d).
- **Busca textual global** e ordenação persistida entre sessões.
- **Exclusão física** de locais — proibida pela RN-G-06.
