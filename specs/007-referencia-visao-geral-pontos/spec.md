# Feature Specification: Referência da estação e visão geral de Pontos de coleta

**Feature Branch**: `007-referencia-visao-geral-pontos`

**Created**: 2026-07-31

**Status**: Draft

**Input**: Quatro telas de referência entregues pelo Gestor do produto — listagem total com alternância
entre cartões e tabela, painel de cadastro de estação, painel de exibição de estação, e a sobreposição
do formulário de Local sobre o cadastro de estação — somadas às decisões tomadas em conversa sobre
obrigatoriedade da referência, aviso de pendências no rodapé e recorte de escopo.

**Rastreabilidade**: estende **CA-02** (cadastro de ponto com QR, entregue na feature 003) com a
identificação da estação e a edição; entrega para Pontos o equivalente de **VH-01** (visão geral em
lista). **VH-02** (volume por ponto) é entregue **apenas na ficha de uma estação** — a listagem não
mostra volume, conforme o recorte registrado em *Out of Scope*.

**Regras transversais aplicáveis**: **RN-G-01** (litros reais, nunca declarados), **RN-G-02** (valor
social = R$ 1,00 × litros reais), **RN-G-05** (Local 1:N Ponto, QR único por ponto), **RN-G-06** (soft
delete: arquivado sai das listas ativas e preserva histórico).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver todas as estações numa tela só (Priority: P1)

O Gestor precisa acompanhar as estações físicas da operação inteira. Hoje só consegue ver estações
entrando em um local por vez, e o item "Pontos de coleta" do menu não leva a tela nenhuma. Esta
história entrega a visão geral: todas as estações de todos os locais na mesma lista, com contagem,
filtro em cada coluna e alternância entre uma visualização em cartões — boa para reconhecer o QR de
cada estação — e uma em tabela, boa para comparar e filtrar.

**Why this priority**: é a lacuna mais visível, um item de menu que não funciona, e é a tela que
hospeda todas as outras histórias. Sem ela, nada mais tem de onde ser aberto.

**Independent Test**: com estações cadastradas em pelo menos dois locais diferentes, abrir a tela pelo
menu, conferir que aparecem estações dos dois locais, alternar entre cartões e tabela, e filtrar por
local. Entrega valor sozinha, mesmo antes de existir referência de estação.

**Acceptance Scenarios**:

```gherkin
Cenário: Acessar a visão geral pelo menu
  Dado que sou um Gestor autenticado
  Quando escolho "Pontos de coleta" no menu
  Então vejo a lista de estações de todos os locais
  E vejo a quantidade de estações exibidas

Cenário: Ver estações de locais diferentes na mesma lista
  Dado que existem estações em dois locais distintos
  Quando abro a visão geral de estações
  Então vejo estações dos dois locais
  E cada estação informa a que local pertence

Cenário: Alternar entre cartões e tabela
  Dado que estou na visão geral de estações
  Quando escolho a visualização em tabela
  Então as mesmas estações aparecem em formato de tabela
  E o filtro aplicado continua valendo

Cenário: Filtrar por local
  Dado que estou na visão geral de estações
  Quando filtro a coluna de local por um local específico
  Então vejo apenas as estações daquele local
  E a contagem de exibidas reflete o filtro

Cenário: Só as ativas por padrão
  Dado que existem estações ativas e estações arquivadas
  Quando abro a visão geral de estações
  Então vejo apenas as ativas
  E alcanço as arquivadas pelo filtro de situação

Cenário: Chegar filtrado a partir de um local
  Dado que estou na visão geral de Locais
  Quando escolho ver as estações de um local
  Então chego à visão geral de estações já filtrada por aquele local

Cenário: Nenhuma estação cadastrada
  Dado que não existe nenhuma estação
  Quando abro a visão geral de estações
  Então vejo um aviso de que não há estações cadastradas
  E vejo o caminho para cadastrar a primeira
```

---

### User Story 2 - Distinguir duas estações do mesmo local (Priority: P1)

Um local costuma ter mais de uma estação: portaria, bloco B, cantina, garagem. Hoje uma estação não
tem rótulo nenhum, então duas estações do mesmo local são indistinguíveis a olho, e o Coletor que
recebe a tarefa não sabe onde procurar. Esta história dá à estação uma **referência**: um rótulo curto
que descreve onde ela fica dentro do local.

**Why this priority**: é a informação que torna a lista utilizável. Sem ela, a visão geral da US1
mostra várias linhas iguais para o mesmo local.

**Independent Test**: cadastrar duas estações no mesmo local com referências diferentes e conferir que
a lista as distingue sem abrir nenhuma das duas; alterar a referência de uma estação existente e ver a
mudança refletida na lista.

**Acceptance Scenarios**:

```gherkin
Cenário: Identificar a estação pela referência
  Dado que um local tem duas estações com referências diferentes
  Quando abro a visão geral de estações
  Então cada estação é identificada pela sua referência
  E o local aparece junto, compondo a identificação

Cenário: Estação cadastrada antes desta feature
  Dado que existe uma estação sem referência
  Quando abro a visão geral de estações
  Então essa estação é identificada pela sua referência curta
  E nenhum rótulo é inventado para ela

Cenário: Corrigir a referência de uma estação
  Dado que estou na ficha de uma estação
  Quando altero a referência e confirmo
  Então a nova referência passa a identificar a estação na lista

Cenário: Referência é exigida em cadastro novo
  Dado que estou cadastrando uma estação
  Quando deixo a referência em branco
  Então não consigo concluir o cadastro
  E sei que a referência é necessária

Cenário: Referência com espaços em volta
  Dado que estou cadastrando uma estação
  Quando informo uma referência com espaços antes e depois
  Então a referência é guardada sem os espaços sobrando

Cenário: Obrigatoriedade valendo fora da tela
  Dado que uma tentativa de cadastro chega sem referência, contornando o formulário
  Quando o sistema a processa
  Então o cadastro é recusado
```

---

### User Story 3 - Cadastrar uma estação sem sair da tela (Priority: P2)

Cadastrar uma estação exige escolher o local e nomear a estação. O Gestor faz isso em um painel que se
abre sobre a lista, sem trocar de tela e sem perder o contexto do que estava vendo. O local é escolhido
por um campo de busca com sugestões, porque a operação tem dezenas de locais e rolar uma lista inteira
é pior do que digitar três letras. O QR não é preenchido: o sistema o gera, e o painel diz isso em vez
de deixar o Gestor procurando o campo.

**Why this priority**: o cadastro já existe hoje (CA-02), então esta história melhora um caminho que
funciona, em vez de abrir um que falta. Vem depois das duas primeiras.

**Independent Test**: abrir o painel pela lista, buscar um local pelo nome, informar a referência,
concluir, e conferir que a nova estação aparece na lista com o QR disponível.

**Acceptance Scenarios**:

```gherkin
Cenário: Cadastrar estação em local existente
  Dado que estou na visão geral de estações
  Quando abro o cadastro de estação
  E busco um local pelo nome e o escolho
  E informo a referência da estação
  E confirmo
  Então a estação passa a constar na lista
  E o QR dela está disponível

Cenário: Buscar local pelo bairro
  Dado que estou no cadastro de estação
  Quando digito o nome de um bairro no campo de local
  Então vejo os locais daquele bairro como sugestão

Cenário: Saber que o QR é automático
  Dado que estou no cadastro de estação
  Quando observo o painel
  Então sei que o QR é gerado ao concluir
  E sei o que fazer depois de concluir

Cenário: Concluir indisponível sem local
  Dado que estou no cadastro de estação
  Quando não escolhi nenhum local
  Então não consigo concluir
  E sei que falta escolher o local

Cenário: Local arquivado não recebe estação nova
  Dado que um local está arquivado
  Quando busco esse local no cadastro de estação
  Então ele não é oferecido como opção

Cenário: Desistir do cadastro
  Dado que preenchi parte do cadastro de estação
  Quando cancelo
  Então nenhuma estação é criada
  E volto à lista como estava
```

---

### User Story 4 - Consultar a ficha de uma estação (Priority: P2)

Ao abrir uma estação, o Gestor vê tudo sobre ela sem sair da lista: o QR com o endereço público para
copiar ou imprimir, quanto já foi recolhido ali, o valor social correspondente, a média por coleta, a
que local pertence, e o histórico de coletas com data, quem coletou e quanto. É a tela que responde
"esta estação está funcionando?".

**Why this priority**: entrega o **VH-02** (volume por estação) e é onde o Gestor decide arquivar,
corrigir a referência ou registrar uma coleta. Depende da US1 para ter de onde ser aberta.

**Independent Test**: abrir a ficha de uma estação com coletas registradas e conferir os três
indicadores contra as coletas listadas; abrir a ficha de uma estação sem coleta e conferir que os
números não mentem.

**Acceptance Scenarios**:

```gherkin
Cenário: Ver os indicadores da estação
  Dado que uma estação tem coletas registradas
  Quando abro a ficha dela
  Então vejo o total de litros reais recolhidos
  E vejo o valor social correspondente, a R$ 1,00 por litro
  E vejo a média de litros por coleta

Cenário: Estação sem nenhuma coleta
  Dado que uma estação não tem coleta registrada
  Quando abro a ficha dela
  Então o total recolhido é zero
  E a média por coleta não é apresentada como zero

Cenário: Ver o histórico de coletas
  Dado que uma estação tem coletas registradas
  Quando abro a ficha dela
  Então vejo cada coleta com data, quem coletou e quantos litros
  E as coletas mais recentes aparecem primeiro

Cenário: Coleta sem coletor informado
  Dado que uma coleta foi registrada sem identificar quem coletou
  Quando vejo o histórico da estação
  Então essa linha indica que o coletor não foi informado
  E os litros e a data continuam visíveis

Cenário: Copiar o endereço público do QR
  Dado que estou na ficha de uma estação
  Quando copio o endereço do QR
  Então o endereço copiado é o endereço completo da estação
  E abre a estação correta

Cenário: Chegar ao local a partir da estação
  Dado que estou na ficha de uma estação
  Quando escolho ver o local dela
  Então a ficha do local se abre sobre a ficha da estação

Cenário: Arquivar a estação
  Dado que estou na ficha de uma estação ativa
  Quando a arquivo
  Então ela sai da lista de ativas
  E o histórico e o valor social gerado permanecem

Cenário: Falha ao carregar o histórico
  Dado que a consulta do histórico não responde
  Quando abro a ficha de uma estação
  Então o restante da ficha continua utilizável
  E sei que o histórico não pôde ser carregado
```

---

### User Story 5 - Cadastrar o local que ainda não existe, sem perder o cadastro da estação (Priority: P3)

Quando o Gestor vai cadastrar a estação de um local recém-conquistado, o local ainda não está no
sistema. Hoje isso obrigaria a abandonar o cadastro, ir cadastrar o local e começar de novo. Nesta
história a busca que não encontra nada oferece cadastrar o local ali mesmo: o formulário de local abre
**sobre** o cadastro da estação, e ao concluir o local volta já escolhido no campo.

**Why this priority**: economiza um desvio de frequência baixa e custo alto — perder o que já foi
digitado. Depende da US3.

**Independent Test**: no cadastro de estação, buscar um local que não existe, cadastrar o local pelo
caminho oferecido, e conferir que ele volta escolhido e que a estação é criada sem redigitar nada.

**Acceptance Scenarios**:

```gherkin
Cenário: Cadastrar o local sem perder o cadastro da estação
  Dado que estou no cadastro de estação
  Quando busco um local que não existe
  Então me é oferecido cadastrar esse local
  E ao escolher essa opção o formulário de local abre sobre o cadastro da estação
  E o cadastro da estação continua visível atrás

Cenário: Local criado volta escolhido
  Dado que abri o cadastro de local a partir do cadastro de estação
  Quando concluo o cadastro do local
  Então o formulário de local fecha
  E o local criado aparece escolhido no campo da estação
  E a referência que eu já havia digitado continua preenchida

Cenário: Desistir do local sem perder a estação
  Dado que abri o cadastro de local a partir do cadastro de estação
  Quando cancelo o cadastro do local
  Então nenhum local é criado
  E volto ao cadastro da estação com o que já havia preenchido
```

---

### User Story 6 - Saber o que falta preencher antes de tentar salvar (Priority: P3)

Quando a ação de salvar está indisponível, o Gestor não deveria precisar adivinhar o motivo. O rodapé
do painel passa a dizer o que falta, em texto curto. A mesma regra vale para o cadastro de Local, que
hoje apenas desabilita o botão — as duas telas devem se comportar igual.

**Why this priority**: melhora a clareza de telas que já funcionam. É a história que pode sair por
último sem bloquear nada.

**Independent Test**: abrir os dois formulários (estação e local), deixar obrigatórios em branco, e
conferir que o rodapé nomeia o que falta e que a mensagem desaparece quando tudo está preenchido.

**Acceptance Scenarios**:

```gherkin
Cenário: Rodapé informa o que falta na estação
  Dado que estou no cadastro de estação
  Quando ainda não escolhi o local
  Então o rodapé me diz que falta escolher o local

Cenário: Rodapé informa o que falta no local
  Dado que estou no cadastro de local
  Quando há obrigatórios em branco
  Então o rodapé nomeia quais campos faltam

Cenário: Aviso desaparece quando está completo
  Dado que um formulário tem obrigatórios em branco
  Quando preencho todos eles
  Então o aviso de pendências desaparece
  E a ação de salvar fica disponível
```

---

### Edge Cases

- **Estação sem referência** (cadastrada antes desta feature): é identificada pela referência curta e
  nenhum rótulo é inventado. Continua editável para receber uma referência.
- **Duas estações com a mesma referência no mesmo local**: permitido. A identidade única de uma
  estação é o QR (RN-G-05); a referência é ajuda humana, não chave.
- **Referência muito longa**: limitada a um tamanho que caiba como título de cartão.
- **Estação sem nenhuma coleta**: total e valor social são zero — que é o dado correto — mas a média
  por coleta não existe e não deve ser apresentada como zero.
- **Coleta sem coletor informado**: a linha do histórico indica a ausência em vez de deixar espaço
  vazio, que pareceria falha de carregamento.
- **Local arquivado**: não é oferecido na busca do cadastro de estação, porque não recebe estação nova.
- **Estação arquivada**: fora da lista ativa por padrão (RN-G-06), alcançável pelo filtro de situação,
  com histórico e valor social preservados.
- **Busca de local sem nenhum resultado**: é o gatilho da US5, não uma mensagem de erro.
- **Área de transferência indisponível**: copiar o endereço do QR pode falhar no navegador; o endereço
  permanece visível para seleção manual.
- **Endereço público exibido de forma abreviada**: a abreviação é apenas visual; o que é copiado é
  sempre o endereço completo, sob pena de entregar um link que não abre.
- **Muitas estações**: filtragem e alternância continuam responsivas com dezenas de estações, sem
  paginação no servidor.
- **Estação cujo local foi arquivado depois**: continua listada e mantém o vínculo com o local
  (RN-G-05).

## Requirements *(mandatory)*

### Functional Requirements

**Visão geral (US1)**

- **FR-001**: O sistema MUST oferecer uma tela de visão geral que liste estações de **todos** os locais
  na mesma lista.
- **FR-002**: O item "Pontos de coleta" do menu MUST levar a essa tela.
- **FR-003**: Cada estação listada MUST informar a que local pertence.
- **FR-004**: A tela MUST permitir alternar entre visualização em cartões e em tabela, preservando os
  filtros aplicados ao alternar.
- **FR-005**: A tela MUST oferecer filtro por coluna, incluindo por local e por situação, no mesmo
  padrão já adotado na visão geral de Locais.
- **FR-006**: A tela MUST exibir a quantidade de estações exibidas e o total carregado.
- **FR-007**: A tela MUST exibir apenas estações ativas por padrão (RN-G-06), com as arquivadas
  alcançáveis pelo filtro de situação.
- **FR-008**: A visão geral de Locais MUST levar à visão geral de estações já filtrada pelo local de
  origem, substituindo a tela de estações por local existente hoje.
- **FR-009**: A tela MUST distinguir "nenhuma estação cadastrada" de "nenhuma estação corresponde ao
  filtro", com saída própria para cada caso.

**Referência da estação (US2)**

- **FR-010**: Uma estação MUST poder ter uma **referência** que descreva onde ela fica dentro do local.
- **FR-011**: A referência MUST ser exigida no cadastro de novas estações.
- **FR-012**: O sistema MUST aceitar estações já cadastradas **sem** referência, sem lhes atribuir
  valor inventado.
- **FR-013**: Estação sem referência MUST ser identificada pela sua referência curta.
- **FR-014**: A referência MUST identificar a estação como título na lista e na ficha, com o local
  compondo a identificação.
- **FR-015**: O sistema MUST permitir alterar a referência de uma estação já cadastrada.
- **FR-016**: O sistema MUST descartar espaços em excesso ao redor da referência informada.
- **FR-017**: O sistema MUST limitar a referência a **60 caracteres** — suficiente para "bloco B ·
  garagem coberta" e curto o bastante para caber como título de cartão sem truncar.
- **FR-018**: A obrigatoriedade da referência MUST ser garantida pelo servidor, não apenas pela tela.

**Cadastro em painel (US3)**

- **FR-019**: O cadastro de estação MUST acontecer em painel sobreposto à lista, no padrão já adotado
  para Locais: cabeçalho e rodapé fixos, trilha acima do título.
- **FR-020**: O local MUST ser escolhido por campo de busca com sugestões, pesquisando por nome e por
  bairro.
- **FR-021**: O campo de busca MUST oferecer apenas locais ativos.
- **FR-022**: O painel MUST informar que o QR é gerado pelo sistema ao concluir, deixando claro que não
  é campo a preencher.
- **FR-023**: O painel MUST orientar o que fazer depois de concluir o cadastro.
- **FR-024**: A ação de concluir MUST ficar indisponível enquanto local ou referência estiverem
  pendentes.
- **FR-025**: Cancelar o cadastro MUST não criar estação alguma.
- **FR-026**: Cada estação criada MUST receber um QR único (RN-G-05).

**Ficha da estação (US4)**

- **FR-027**: A ficha MUST abrir em painel sobreposto, sem trocar de tela.
- **FR-028**: A ficha MUST exibir a referência como título, o local e a situação.
- **FR-029**: A ficha MUST exibir o QR da estação, sua referência curta e o endereço público
  correspondente.
- **FR-030**: A ficha MUST permitir baixar o QR e copiar o endereço público.
- **FR-031**: O endereço copiado MUST ser o endereço completo da estação, mesmo quando exibido
  abreviado.
- **FR-032**: A ficha MUST exibir o total de litros **reais** recolhidos na estação (RN-G-01).
- **FR-033**: A ficha MUST exibir o valor social correspondente, a R$ 1,00 por litro real (RN-G-02).
- **FR-034**: A ficha MUST exibir a média de litros por coleta. Sem nenhuma coleta registrada, MUST
  exibir marca de ausência no lugar da média, **nunca** o valor zero — zero afirmaria que as coletas
  vieram vazias.
- **FR-035**: A ficha MUST listar o histórico de coletas da estação com data, quem coletou e litros,
  das mais recentes para as mais antigas.
- **FR-036**: O histórico MUST indicar explicitamente quando o coletor não foi informado.
- **FR-037**: A ficha MUST permitir abrir a ficha do local da estação, sobreposta à ficha da estação.
- **FR-038**: A ficha MUST permitir arquivar e reativar a estação, preservando histórico e valor social
  gerado (RN-G-06).
- **FR-039**: A ficha MUST permitir alterar a referência da estação.
- **FR-040**: A ficha MUST levar ao registro de coleta da estação.
- **FR-041**: Falha ao carregar o histórico MUST degradar apenas essa seção, mantendo o resto da ficha
  utilizável e avisando que o histórico não veio.

**Criação de local empilhada (US5)**

- **FR-042**: Quando a busca de local não encontrar correspondência, o sistema MUST oferecer cadastrar
  o local a partir dali.
- **FR-043**: O cadastro de local MUST abrir **sobre** o cadastro da estação, sem fechá-lo.
- **FR-044**: O painel sobreposto MUST deixar visível que existe um painel atrás dele.
- **FR-045**: Ao concluir o cadastro do local, o local criado MUST voltar escolhido no campo de busca e
  o painel de cima MUST fechar.
- **FR-046**: O que já havia sido preenchido no cadastro da estação MUST ser preservado durante e
  depois do cadastro do local.
- **FR-047**: Cancelar o cadastro do local MUST não criar local algum e MUST devolver o cadastro da
  estação intacto.
- **FR-048**: O formulário de local MUST ser o mesmo já existente, não uma segunda versão dele.

**Aviso de pendências (US6)**

- **FR-049**: Enquanto a ação de salvar estiver indisponível, o rodapé do painel MUST informar o que
  falta preencher.
- **FR-050**: O aviso MUST desaparecer quando não houver mais pendências.
- **FR-051**: O cadastro de Local MUST passar a exibir esse aviso, para as duas telas não divergirem.

**Transversais**

- **FR-052**: Todos os rótulos, mensagens e avisos novos MUST estar em português brasileiro.
- **FR-053**: As telas MUST ser utilizáveis a partir de 360 px de largura.
- **FR-054**: Nenhuma superfície pública MUST passar a expor dado que hoje não expõe.

### Key Entities

- **Ponto de coleta (estação)**: estação física dentro de um local, com QR único (RN-G-05). Ganha nesta
  feature uma **referência** — rótulo curto que descreve onde a estação fica dentro do local (portaria,
  bloco B, cantina). Ausente no acervo existente e exigida em cadastros novos. Mantém situação
  ativa/arquivada (RN-G-06).
- **Referência curta**: os primeiros oito caracteres do identificador da estação, já usada hoje nas
  telas de Pontos. Serve para citar uma estação em conversa e é a identificação de reserva de quem
  ainda não tem referência.
- **Local**: já existente; passa a ser escolhido por busca no cadastro de estação e criável a partir
  dele. Um local tem várias estações.
- **Coleta**: já existente; é a origem dos três indicadores da ficha e do histórico. Registra litros
  reais, data e, opcionalmente, quem coletou.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O Gestor alcança qualquer estação da operação a partir do menu, sem precisar saber antes
  a que local ela pertence — hoje isso é impossível.
- **SC-002**: Duas estações do mesmo local são distinguíveis na lista **sem abrir** nenhuma das duas.
- **SC-003**: 100% das estações já cadastradas continuam listadas depois desta feature, nenhuma com
  rótulo inventado.
- **SC-004**: Cadastrar uma estação em um local já cadastrado é concluído sem sair da tela de estações.
- **SC-005**: Cadastrar uma estação para um local ainda não cadastrado é concluído sem perder nada do
  que já foi digitado e sem trocar de tela.
- **SC-006**: A ficha responde "quanto já foi recolhido aqui, quanto isso vale e quando foi a última
  coleta" em uma única abertura, sem navegação adicional.
- **SC-007**: Os três indicadores da ficha conferem com o histórico exibido: o total é a soma dos
  litros listados e o valor social é esse total a R$ 1,00 por litro.
- **SC-008**: O endereço copiado do QR abre a estação correta em 100% dos casos.
- **SC-009**: Uma coleta sem coletor informado aparece no histórico sem parecer erro de carregamento.
- **SC-010**: Em qualquer formulário desta feature e no de Locais, o Gestor descobre o que falta
  preencher **sem tentar salvar**.
- **SC-011**: As telas permanecem utilizáveis a 360 px de largura, sem rolagem horizontal do conteúdo.
- **SC-012**: A indisponibilidade do histórico de coletas não impede o uso do resto da ficha.

## Out of Scope

Recortes decididos pelo Gestor do produto, registrados com o motivo para que a ausência não seja lida
como esquecimento:

| Elemento das telas de referência | Por que ficou fora |
|---|---|
| Litros acumulados e data da última coleta **nos cartões** da listagem | O agregado de impacto existente só desce até o nível de local. Obter esses números por estação custaria uma consulta por cartão. A informação continua disponível na **ficha** de cada estação, onde é uma consulta só e já necessária para o histórico. Consequência aceita: **VH-02 não é entregue na listagem**, apenas na ficha. |
| Folha de adesivos imprimível com vários QR de uma vez | Recurso novo, sem base existente. Adiado por peso, não por dúvida de valor. |
| Registrar coleta como painel empilhado sobre a ficha | O registro de coleta já tem tela própria. A ficha **leva** até ela, em vez de reimplementar o formulário. |
| Data da última coleta **do local** no bloco de local da ficha | Esse dado não existe agregado por local. Usar a última coleta da própria estação ou omitir. |
| Volume por estação **por período** (parte do VH-02) | A ficha mostra o acumulado; o corte por período fica para quando houver uma visão de histórico com filtro de datas. |
| Contadores do menu lateral e card de meta | Já existem e não mudam nesta feature. |

## Assumptions

- **Referência repetida no mesmo local é permitida.** A identidade única de uma estação é o QR
  (RN-G-05); a referência é ajuda humana. Duas "portaria" no mesmo local são erro de cadastro, não
  violação de invariante, e bloquear exigiria uma regra que ninguém pediu.
- **A referência é texto livre curto**, não lista fechada. Os exemplos das telas — portaria, bloco B,
  cantina, pátio, garagem, balcão — são diversos demais para um domínio fixo, e uma lista fechada
  obrigaria a manter cadastro de opções.
- **A alternância cartões/tabela não é lembrada** entre visitas. Nada nas telas de referência sugere
  memória de preferência, e persistir exigiria decidir onde guardar.
- **Cartões e tabela mostram o mesmo conjunto** de estações e obedecem aos mesmos filtros; a diferença
  é só de apresentação.
- **A ordenação padrão** é por local e, dentro do local, por referência — o que aproxima as estações
  que o Gestor tende a comparar.
- **O histórico de coletas da ficha não é paginado** nesta feature: uma estação acumula coletas em
  ritmo baixo o suficiente para a lista completa ser aceitável.
- **A média por coleta** é o total de litros reais dividido pelo número de coletas registradas na
  estação, sem recorte de período.
- **Estação arquivada** não recebe coleta nova — comportamento já existente, não alterado aqui.
- **A busca de local filtra sobre o acervo de locais ativos já carregado**, sem consulta a cada tecla.
  A operação tem dezenas de locais, não milhares.
- **O aviso de pendências é fornecido por cada formulário**, não montado pelo painel: as telas de
  referência frasearam de duas formas diferentes — "falta preencher: …" e "escolha o local do ponto" —
  e quem sabe quais campos existem é o formulário.
- **A tela de estações por local deixa de existir** como rota própria, substituída pela visão geral
  filtrada. Nenhum recurso dela se perde: QR, arquivamento e reativação passam a viver na visão geral
  e na ficha.
