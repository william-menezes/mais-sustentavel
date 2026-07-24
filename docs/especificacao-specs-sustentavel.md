# Histórias e Subtarefas — Backlog completo (Jira-ready) · + Sustentável

> Padrão de cada história: **cabeçalho com o ID e a história completa** (Como… quero… para…), uma **breve descrição** e as **Subtasks**.
> Subtarefas começam com verbo no infinitivo; os **story points (Fibonacci)** ficam nas subtarefas, e o total da história é a soma delas.
> **Parte 1 — Comprometido:** Sprints 1–4 (subtarefas obrigatórias pela disciplina). **Parte 2 — Backlog:** planos futuros, já com subtarefas prontas.

---

## Índice de pontos

| ID | História | Onde | Pts |
|----|----------|------|-----|
| H01 | Ajustes iniciais do projeto | Sprint 1 | 8 |
| AC-01 | Esqueleto + Autenticação + papéis | Sprint 2 | 12 |
| CA-01 | Cadastrar Local | Sprint 2 | 6 |
| CA-02 | Cadastrar Ponto (QR) | Sprint 3 | 7 |
| OP-03 | Registrar coleta (litros reais) | Sprint 3 | 7 |
| IS-01 | Cálculo do valor social | Sprint 3 | 4 |
| IS-02 | Painel de impacto | Sprint 4 | 5 |
| LP-01 | Landing (hero + modelo) | Sprint 4 | 3 |
| AC-02 | Criação de conta | Backlog | 5 |
| AC-03 | Implementação plena dos papéis | Backlog | 7 |
| AC-04 | Controle de acesso por escopo | Backlog | 6 |
| AC-05 | Preferência de anonimato | Backlog | 3 |
| CA-03 | Cadastrar usuário | Backlog | 4 |
| CA-04 | Vincular Responsável a Local | Backlog | 4 |
| OP-01 | Visualizar pontos e QR (dedicado) | Backlog | 3 |
| OP-02 | Solicitar coleta | Backlog | 6 |
| OP-04 | Estados da solicitação | Backlog | 5 |
| OP-05 | Reconciliação anti-fraude | Backlog | 7 |
| IS-03 | Impacto do Responsável | Backlog | 2 |
| VH-01 | Listar locais | Backlog | 1 |
| VH-02 | Quantidade por ponto | Backlog | 2 |
| VH-03 | Listar usuários | Backlog | 1 |
| VH-04 | Histórico do Responsável | Backlog | 3 |
| LP-01b | Landing: apoiadores | Backlog | 1 |
| LP-01d | Landing: mapa de pontos | Backlog | 5 |
| LP-01e | Landing: footer | Backlog | 1 |
| DG-01 | Doação via QR (Doador em produção) | Backlog | 10 |
| DG-02 | Validação da doação | Backlog | 4 |
| DG-03 | Estados da doação | Backlog | 2 |
| DG-04 | Cálculo de pontos | Backlog | 5 |
| DG-05 | Notificações de campanha | Backlog | 5 |
| DG-06 | Campanhas com período | Backlog | 4 |
| DG-07 | Ranking com desempate | Backlog | 4 |
| DG-08 | Premiação anual | Backlog | 2 |
| MF-01a | Matriz de compatibilidade | Backlog | 2 |
| MF-01b | Visualização em tabela | Backlog | 2 |
| MF-01c | Visualização em kanban | Backlog | 2 |
| MF-01d | Visualização em mapa | Backlog | 2 |
| MF-01e | Visualização em agenda | Backlog | 2 |

**Comprometido:** 52 pts · **Backlog:** 106 pts · **Total do produto:** 158 pts.

---

# PARTE 1 — COMPROMETIDO

## Sprint 1 — Ajustes iniciais (22–29/06)

### H01 — Como time, queremos preparar a base do projeto, para iniciar o desenvolvimento com tudo definido.

História fixa da disciplina, igual para todos os grupos. Dedicada a montar a fundação do projeto — repositório, tecnologias e escopo — e a escrever e organizar o backlog inicial.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Criar o repositório no GitHub | 1 |
| 2 | Definir linguagem e tecnologias (Java/Spring, Docker, Render, banco, frontend) | 2 |
| 3 | Definir o escopo final do sistema | 2 |
| 4 | Escrever e organizar as histórias no backlog | 3 |
| | **Total** | **8** |

---

## Sprint 2 — Esqueleto, Acesso e Local (01–08/07)

### AC-01 — Como Gestor, quero entrar no sistema sobre uma base já implantada e com os papéis modelados, para administrar a operação.

Reúne a fundação técnica do projeto: esqueleto Spring em camadas, primeiro deploy na Render e autenticação. Os quatro papéis já ficam modelados no banco (user_roles N:N), com apenas o Gestor ativo no MVP.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Estruturar o projeto Spring Boot em camadas (controller/service/repository — OO) | 2 |
| 2 | Configurar Dockerfile, deploy na Render e conexão com o Postgres | 3 |
| 3 | Modelar Usuário, Papéis (4) e user_roles N:N (só Gestor ativo no MVP) | 2 |
| 4 | Implementar a autenticação (login/logout) com Spring Security | 3 |
| 5 | Desenvolver a tela de login com feedback de erro | 2 |
| | **Total** | **12** |

### CA-01 — Como Gestor, quero cadastrar locais, para organizar a operação por instituição.

Permite registrar os locais atendidos (condomínios, escolas, empresas, espaços públicos), com arquivamento (soft delete) que remove das listas ativas mas preserva o histórico e o valor social gerado.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Modelar a entidade Local (nome, tipo, endereço, flag de arquivamento) com JPA | 2 |
| 2 | Implementar o CRUD de Local (service + controller) | 2 |
| 3 | Desenvolver a tela de cadastro e listagem de Local | 2 |
| | **Total** | **6** |

---

## Sprint 3 — Pontos, Coleta e Valor Social (11–18/07)

### CA-02 — Como Gestor, quero cadastrar pontos de coleta dentro de um local, para que cada estação tenha seu QR.

Cada ponto pertence a um local (relação 1:N) e recebe um QR Code único que identifica a estação física de coleta. Um local pode ter vários pontos.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Modelar a entidade Ponto (relação 1:N com Local) com JPA | 2 |
| 2 | Gerar QR Code único por ponto (biblioteca Java) | 3 |
| 3 | Desenvolver a tela de cadastro de Ponto com exibição/download do QR | 2 |
| | **Total** | **7** |

### OP-03 — Como Gestor/Coletor, quero registrar os litros reais recolhidos num ponto, para alimentar o valor social.

Registro simplificado da coleta direto no ponto, sem o fluxo de solicitação/estados (que fica no backlog). É a medição real, e não a declaração, que alimenta o cálculo de impacto.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Modelar a entidade Coleta (litros reais, data, ponto) com JPA | 2 |
| 2 | Implementar o serviço de registro de coleta (service + controller) | 3 |
| 3 | Desenvolver a tela de registro de coleta | 2 |
| | **Total** | **7** |

### IS-01 — Como Gestor, quero que cada litro real vire valor social, para medir o impacto.

Converte a medição real das coletas em valor social à razão de R$ 1,00 por litro, agregando os totais por local e por período.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a regra de cálculo (R$ 1/litro real) sobre as coletas | 2 |
| 2 | Implementar a agregação por local e período | 2 |
| | **Total** | **4** |

---

## Sprint 4 — Painel de Impacto e Landing (21–23/07)

### IS-02 — Como Gestor, quero um painel de impacto, para enxergar o total e o detalhamento.

Consolida o valor social gerado numa visão única, com total acumulado e quebra por local e período.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o endpoint de agregados de impacto (service + controller) | 2 |
| 2 | Desenvolver a tela do painel (total + por local/período) | 3 |
| | **Total** | **5** |

### LP-01 — Como visitante, quero entender a proposta e o modelo, para confiar na iniciativa.

Página pública mínima, sem login, com hero, chamada à ação e a explicação do modelo — cada litro soma R$ 1 para causas sociais.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Criar a página pública (rota sem autenticação) com hero e CTA | 2 |
| 2 | Desenvolver a seção "Cada litro soma" (modelo de negócio) | 1 |
| | **Total** | **3** |

---

# PARTE 2 — BACKLOG (planos futuros)

## Épico: Acesso e contas

### AC-02 — Como usuário, quero criar uma conta, para passar a usar o sistema.

Fluxo de autocadastro que cria a conta com o papel padrão definido pelo Gestor e verifica a unicidade do e-mail.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o endpoint de criação de conta (service + controller) | 2 |
| 2 | Desenvolver a tela de cadastro (signup) | 2 |
| 3 | Validar a unicidade do e-mail | 1 |
| | **Total** | **5** |

### AC-03 — Como Gestor, quero ativar Responsável, Coletor e Doador na interface, para operar com todos os perfis.

Leva o modelo de papéis já existente no banco para a interface, com atribuição, troca e acúmulo de papéis por usuário.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a atribuição e troca de papéis na interface | 2 |
| 2 | Desenvolver telas e menus condicionais por papel | 3 |
| 3 | Testar o acúmulo de papéis | 2 |
| | **Total** | **7** |

### AC-04 — Como Gestor, quero que cada papel só acesse o que lhe cabe, para proteger os dados de cada local.

Aplica autorização por papel e restringe os dados ao escopo do usuário — o Responsável enxerga apenas os locais aos quais está vinculado.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar guard de autorização por papel (Spring Security) | 3 |
| 2 | Implementar filtro de dados por escopo (Responsável → seus locais) | 3 |
| | **Total** | **6** |

### AC-05 — Como Doador, quero doar de forma anônima, para controlar minha privacidade.

Preferência de anonimato que mantém a doação no total do local, sem expor o doador no ranking individual.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Adicionar campo de preferência no perfil do Doador | 1 |
| 2 | Aplicar o anonimato no ranking (conta p/ local, não p/ indivíduo) | 2 |
| | **Total** | **3** |

## Épico: Cadastros base

### CA-03 — Como Gestor, quero cadastrar usuários e atribuir papéis, para controlar acessos.

CRUD de usuários com atribuição de papel, complementando o autocadastro do AC-02.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o CRUD de Usuário com papel (service + controller) | 2 |
| 2 | Desenvolver a tela de cadastro e listagem de Usuário | 2 |
| | **Total** | **4** |

### CA-04 — Como Gestor, quero vincular um Responsável a um local, para delegar sua administração.

Cria o vínculo Responsável↔Local que define o escopo de atuação de cada responsável; um responsável pode cobrir mais de um local.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Modelar o vínculo Responsável ↔ Local | 2 |
| 2 | Desenvolver a tela de vínculo | 2 |
| | **Total** | **4** |

## Épico: Núcleo operacional

### OP-01 — Como Gestor/Responsável, quero uma tela dedicada de pontos e QRs, para imprimir e fixar nas estações.

Visão focada nos pontos de um local, com acesso e download dos QR Codes para impressão.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a listagem de pontos por local (service) | 1 |
| 2 | Desenvolver a tela dedicada de pontos com download do QR | 2 |
| | **Total** | **3** |

### OP-02 — Como Responsável, quero solicitar a coleta de um ponto cheio, para que o óleo seja recolhido.

Abre uma solicitação de coleta por ponto (não pelo local inteiro), que entra numa fila para atendimento.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Modelar a entidade Solicitação (por ponto, com status) | 2 |
| 2 | Implementar o serviço de criação de solicitação | 2 |
| 3 | Desenvolver a tela do Responsável para solicitar coleta | 2 |
| | **Total** | **6** |

### OP-04 — Como Gestor, quero acompanhar o ciclo de vida da solicitação, para organizar a operação.

Modela e controla as transições da solicitação: Solicitada → Agendada → Em coleta → Concluída, podendo ser Cancelada antes da conclusão.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a máquina de estados da solicitação (service) | 3 |
| 2 | Refletir e permitir as transições na tela/board | 2 |
| | **Total** | **5** |

### OP-05 — Como Gestor, quero comparar o declarado com o medido, para identificar divergências.

Reconcilia o total declarado pelos doadores com os litros reais coletados e sinaliza divergências acima de um limiar, respeitando a independência Coletor ≠ Responsável.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o serviço de comparação declarado × medido | 3 |
| 2 | Sinalizar divergência acima do limiar (config do Gestor) | 2 |
| 3 | Aplicar a regra de independência Coletor ≠ Responsável | 2 |
| | **Total** | **7** |

## Épico: Impacto social

### IS-03 — Como Responsável, quero ver quanto meu local gerou, para engajar os moradores.

Expõe o valor social do local para o Responsável, reaproveitando os agregados de impacto do IS-01.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver a tela de impacto do local (reusa agregados de IS-01) | 2 |
| | **Total** | **2** |

## Épico: Visualizações e histórico

### VH-01 — Como Gestor, quero listar todos os locais, para ter visão geral.

Listagem consolidada dos locais ativos, com nome, tipo e número de pontos.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar endpoint e tela de listagem de locais | 1 |
| | **Total** | **1** |

### VH-02 — Como Gestor, quero ver o volume por ponto, para acompanhar a operação.

Total de litros reais recolhidos em cada ponto, por período.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a agregação de litros por ponto/período (service) | 1 |
| 2 | Desenvolver a tela de quantidade por ponto | 1 |
| | **Total** | **2** |

### VH-03 — Como Gestor, quero listar todos os usuários, para administrar acessos.

Listagem dos usuários com seus respectivos papéis.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar endpoint e tela de listagem de usuários | 1 |
| | **Total** | **1** |

### VH-04 — Como Responsável, quero ver o histórico de entregas do meu local, para acompanhar o desempenho.

Histórico das coletas do local, com data, ponto e litros reais.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o endpoint de histórico por local (service) | 1 |
| 2 | Desenvolver a tela de histórico | 2 |
| | **Total** | **3** |

## Épico: Landing page

### LP-01b — Como visitante, quero ver quem apoia o projeto, para confiar na iniciativa.

Seção institucional de apoiadores e parceiros na landing.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver a seção de apoiadores/parceiros | 1 |
| | **Total** | **1** |

### LP-01d — Como visitante, quero ver onde estão os pontos, para achar o mais próximo.

Mapa público dos pontos de coleta, com regra de privacidade que oculta o endereço exato de pontos em locais privados (ex.: condomínios).

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Integrar o mapa com os pontos | 3 |
| 2 | Aplicar a regra de privacidade (pontos privados) | 2 |
| | **Total** | **5** |

### LP-01e — Como visitante, quero contato e informações institucionais, para falar com a empresa.

Rodapé da landing com contato, redes e informações institucionais.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver o rodapé com contato, redes e institucional | 1 |
| | **Total** | **1** |

## Épico: Gamificação

### DG-01 — Como Doador, quero declarar minha doação escaneando o QR, para participar da gamificação.

Coloca o papel Doador em produção e registra a doação declarada via QR, com geolocalização opcional que reforça a presença mas nunca bloqueia o fluxo.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Habilitar o papel Doador (autenticação leve + vínculo ao ponto) | 3 |
| 2 | Modelar a entidade Doação (declarada, litros, ponto, doador) | 2 |
| 3 | Implementar o fluxo de leitura do QR e declaração | 3 |
| 4 | Implementar a geolocalização opcional (não bloqueia) | 2 |
| | **Total** | **10** |

### DG-02 — Como Responsável, quero validar as doações do meu local, para que só doações reais pontuem.

Fila de validação onde o Responsável aprova ou rejeita as doações declaradas antes de elas pontuarem.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a fila de validação no local | 2 |
| 2 | Implementar as ações validar/rejeitar | 2 |
| | **Total** | **4** |

### DG-03 — Como sistema, quero controlar o ciclo de vida da doação, para rastrear sua situação.

Máquina de estados da doação: Declarada → Validada → Contabilizada, ou Rejeitada.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a máquina de estados da doação (service) | 2 |
| | **Total** | **2** |

### DG-04 — Como Doador, quero que doações validadas gerem pontos, para subir no ranking.

Pontuação por litros declarados validados, atribuída ao local e contada pela data — os pontos permanecem no local mesmo que o doador se mude.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar a regra de pontuação por litros declarados validados | 2 |
| 2 | Implementar a atribuição ao local, contada por data | 3 |
| | **Total** | **5** |

### DG-05 — Como usuário, quero ser avisado das campanhas, para participar.

Notificações de campanha via serviço externo de e-mail/push, disparadas no início de cada campanha.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Integrar serviço externo de e-mail/push | 3 |
| 2 | Disparar notificação no início da campanha | 2 |
| | **Total** | **5** |

### DG-06 — Como Gestor, quero criar campanhas com início e fim, para organizar a gamificação.

Campanhas com período definido; a gamificação passa a considerar apenas doações dentro do intervalo.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Modelar a entidade Campanha (início/fim) | 2 |
| 2 | Implementar o filtro de doações por período da campanha | 2 |
| | **Total** | **4** |

### DG-07 — Como Doador, quero ver o ranking da campanha, para acompanhar minha posição.

Ranking ordenado por pontuação, com desempate por quem atingiu a marca primeiro (pela data da doação).

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o cálculo e a ordenação do ranking | 2 |
| 2 | Implementar o desempate por quem atingiu primeiro | 2 |
| | **Total** | **4** |

### DG-08 — Como Gestor, quero levantar quem mais doou no ano, para premiar.

Levantamento anual dos maiores doadores para fins de premiação.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Implementar o levantamento de top doadores no ano | 2 |
| | **Total** | **2** |

## Épico: Visualizações multi-formato

### MF-01a — Como Gestor, quero definir quais formatos servem a quais dados, para evitar visualizações sem sentido.

Matriz de compatibilidade entre formatos (tabela, kanban, mapa, agenda) e conjuntos de dados, indicando os campos que cada formato exige.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Definir a matriz formato × dataset e campos exigidos | 2 |
| | **Total** | **2** |

### MF-01b — Como usuário, quero ver dados em tabela, para analisar registro a registro.

Componente de tabela com ordenação para os datasets compatíveis.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver o componente de tabela com ordenação | 2 |
| | **Total** | **2** |

### MF-01c — Como usuário, quero ver dados com estados em kanban, para acompanhar o fluxo.

Componente kanban que distribui os registros em colunas por estado.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver o componente kanban por estados | 2 |
| | **Total** | **2** |

### MF-01d — Como usuário, quero ver dados geográficos em mapa, para entender a distribuição.

Componente de mapa que posiciona os registros com coordenadas.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver o componente de mapa por coordenadas | 2 |
| | **Total** | **2** |

### MF-01e — Como usuário, quero ver dados com datas em agenda, para enxergar a linha do tempo.

Componente de agenda/calendário que distribui os registros por data.

**Subtasks**

| # | Subtarefa | Pts |
|---|-----------|-----|
| 1 | Desenvolver o componente de agenda/calendário por datas | 2 |
| | **Total** | **2** |

---

## Observações para o Jira

- No Jira, o cabeçalho de cada história (a frase "Como… quero… para…") vira o **resumo** do item do tipo *História*; a breve descrição vai no campo de **descrição**; cada linha da tabela vira uma **Subtarefa** com os pontos no campo de estimativa.
- Só as histórias comprometidas (Parte 1) precisam de subtarefas para cumprir o requisito da disciplina; as subtarefas do backlog já vão prontas para quando você puxar o item.
- Para o relatório final: **backlog atual** = tudo na Parte 2 + o que não fechou na Parte 1; **não deu tempo** = itens comprometidos não concluídos; **planos futuros** = épicos de Gamificação e Multi-formato.
- Os critérios de aceite em Gherkin de todas as histórias estão preservados no arquivo `historias-sprints-sustentavel.md`, caso queira anexá-los às descrições.