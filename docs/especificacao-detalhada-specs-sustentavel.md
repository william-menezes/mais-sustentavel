# Especificação Detalhada de Histórias — Insumo para Geração de Specs · + Sustentável

> **Propósito.** Este documento é o insumo que o agente de código (VSCode) consome para gerar os
> specs via `/speckit.specify`. Ele detalha, história a história, todas as regras de negócio,
> fluxos e limites de escopo, para que os specs saiam o mais acurados possível.
>
> **Relação com a constituição.** O `constitution.md` contém os princípios inegociáveis e o stack
> (Java/Spring, Docker/Render, Postgres). Aqui está o **comportamento** de cada história. Seguindo o
> Spec-Driven Development, os specs descrevem o **"o quê / por quê"**; o **"como"** técnico é
> resolvido no `/speckit.plan`. Não prescreva implementação nos specs — descreva regra e resultado.
>
> **Fonte.** Detalha cada história do arquivo `backlog-completo-jira-sustentavel.md`.

---

## 0. Como o agente deve usar este documento

1. Leia primeiro o **Glossário (§1)** e as **Regras Transversais (§2)** — elas valem para todas as histórias e são referenciadas por código (ex.: `RN-G-02`).
2. Gere um spec por **feature** conforme o agrupamento sugerido em **§4** (uma feature reúne histórias coerentes).
3. Para cada feature, use as histórias correspondentes em **§3** como corpo do spec: objetivo, atores, regras, fluxos, critérios de aceite e fora de escopo.
4. Marque como requisito de aceite os cenários Gherkin. Trate a seção **Fora de escopo** como restrição explícita (o que o spec NÃO deve cobrir).
5. Em caso de ambiguidade, prevaleça a regra transversal (§2) e registre a dúvida como `[NEEDS CLARIFICATION]` em vez de assumir.

---

## 1. Glossário do domínio

- **Gestor** — administra o sistema: cadastros, pontos, coletas, impacto. No MVP, é o único papel ativo. Pode acumular o papel de Coletor.
- **Responsável** — administra um ou mais **Locais**; valida doações declaradas e solicita coletas. (Backlog.)
- **Coletor** — registra a coleta física, medindo os litros reais. Pode ser o próprio Gestor. (Ativação plena no backlog.)
- **Doador** — deposita óleo e declara a doação via QR; participa da gamificação. (Backlog.)
- **Local** — instituição atendida (condomínio, escola, empresa, espaço público, outro). Possui 1..N pontos.
- **Ponto de coleta** — estação física dentro de um Local, com **QR Code único**.
- **Coleta** — registro da retirada física de óleo de um ponto, com os **litros reais** medidos.
- **Doação declarada** — registro feito pelo Doador ao depositar; base da gamificação; precisa de validação do Responsável.
- **Litro real** — quantidade medida na coleta; base do **valor social** e da reconciliação.
- **Valor social** — R$ 1,00 por litro real coletado, destinado a causas sociais.
- **Campanha** — período definido pelo Gestor em que a gamificação vigora.
- **Ranking** — ordenação de doadores por pontuação dentro de uma campanha.

---

## 2. Regras de negócio transversais (invariantes)

Aplicam-se a todas as histórias pertinentes; referenciadas por código.

- **RN-G-01 — Dois trilhos de medição.** *Doação declarada* (base da gamificação) e *litros reais coletados* (base do valor social e da reconciliação) são grandezas distintas e nunca se confundem.
- **RN-G-02 — Valor social.** Valor social = R$ 1,00 × litros reais. Calculado **sempre** sobre a medição real, **nunca** sobre o declarado.
- **RN-G-03 — Papéis (RBAC).** Papéis: Gestor, Responsável, Coletor, Doador, em relação **N:N** (`usuario_papel`). Um usuário pode acumular papéis. No MVP, apenas Gestor é ativo; os demais ficam modelados.
- **RN-G-04 — Independência anti-fraude.** O Coletor que mede um ponto **não pode** ser o Responsável que valida as doações do mesmo local.
- **RN-G-05 — Local × Ponto × QR.** Local 1:N Ponto. Cada ponto tem **QR Code único**. O ponto permanece vinculado ao local mesmo que um doador mude de endereço.
- **RN-G-06 — Soft delete.** Local, Ponto e vínculo de Responsável usam exclusão lógica: saem das listas ativas mas preservam histórico e valor social gerado.
- **RN-G-07 — Doação anônima.** Conta para o **total do local**, nunca para o **ranking individual**.
- **RN-G-08 — Pontos seguem o local.** Pontos de gamificação pertencem ao local; ao mudar de local, os pontos anteriores permanecem no local anterior. Contagem pela **data da doação**.
- **RN-G-09 — Desempate.** No ranking, vence quem **atingiu a pontuação primeiro** (pela data da doação).
- **RN-G-10 — Geolocalização opcional.** A geolocalização do navegador reforça a presença, mas **nunca bloqueia** um fluxo se negada.
- **RN-G-11 — Verificação em camadas.** Presença é verificada por camadas (QR + validação do Responsável + reconciliação física). Nenhuma isolada é bloqueador único.
- **RN-G-12 — Unidade.** Toda quantidade é registrada em **litros**.
- **RN-G-13 — Idioma.** Todos os artefatos e textos de interface em **português do Brasil**.

---

## 3. Especificação por história

Template de cada entrada: Objetivo · Atores · Pré-condições · Regras · Fluxo principal · Exceções · Dados/Entidades · Critérios de aceite (Gherkin) · Dependências · Fora de escopo.

---

### H01 — Como time, queremos preparar a base do projeto, para iniciar o desenvolvimento com tudo definido.

- **Objetivo.** História fixa da disciplina; estabelece a fundação (repositório, tecnologias, escopo) e o backlog inicial. Não gera comportamento de software.
- **Atores.** Time (Gestor/dev).
- **Pré-condições.** Nenhuma.
- **Regras.** Segue o stack da constituição. Não há regra de domínio.
- **Fluxo principal.** Criar repositório → definir tecnologias → fechar escopo → escrever backlog.
- **Dados/Entidades.** Nenhuma.
- **Dependências.** Nenhuma.
- **Fora de escopo.** Qualquer funcionalidade de produto — esta história é somente de preparação. *(Não gerar spec técnico desta história.)*

---

### AC-01 — Como Gestor, quero entrar no sistema sobre uma base já implantada e com os papéis modelados, para administrar a operação.

- **Objetivo.** Fundação técnica + autenticação. Sistema implantado (Docker/Render) e login funcionando, com os 4 papéis modelados.
- **Atores.** Gestor.
- **Pré-condições.** Base de dados acessível; ao menos um Gestor semeado (seed).
- **Regras.** RN-G-03 (modelar 4 papéis N:N; só Gestor ativo), RN-G-13. Sessão autenticada carrega o(s) papel(is) do usuário. Credenciais inválidas não autenticam e não revelam qual campo falhou.
- **Fluxo principal.** Usuário informa e-mail e senha → sistema valida → cria sessão com o papel ativo → redireciona para a área administrativa.
- **Exceções.** Credenciais inválidas → mensagem genérica de erro, permanece deslogado. Conta inexistente → mesmo tratamento (não enumerar usuários).
- **Dados/Entidades.** `Usuario(id, nome, email, senha_hash, ...)`, `Papel(id, nome)`, `UsuarioPapel(usuario_id, papel_id)`. Seed dos 4 papéis.
- **Critérios de aceite.**
```gherkin
Cenário: Login válido
  Dado que sou o Gestor cadastrado
  Quando informo e-mail e senha corretos
  Então acesso o sistema autenticado com meu papel ativo
Cenário: Login inválido
  Quando informo credenciais incorretas
  Então recebo mensagem de erro genérica e permaneço deslogado
Cenário: Papéis modelados
  Então existem no banco os papéis Gestor, Responsável, Coletor e Doador
  E apenas o Gestor está ativo na interface
```
- **Dependências.** Nenhuma (fundação).
- **Fora de escopo.** Autocadastro (AC-02), recuperação de senha, atribuição/uso dos papéis Responsável/Coletor/Doador na interface (AC-03), controle de acesso por escopo (AC-04).

---

### CA-01 — Como Gestor, quero cadastrar locais, para organizar a operação por instituição.

- **Objetivo.** Gerir o cadastro de Locais atendidos.
- **Atores.** Gestor.
- **Pré-condições.** Gestor autenticado.
- **Regras.** RN-G-06 (soft delete). Tipos válidos: condomínio, escola, empresa, espaço público, outro. Campos mínimos: nome, tipo, endereço. Local arquivado não aparece em listas ativas mas mantém histórico.
- **Fluxo principal.** Gestor preenche nome, tipo e endereço → salva → local aparece na listagem ativa.
- **Exceções.** Campos obrigatórios ausentes → validação impede salvar. Arquivar → remove das listas ativas, preserva dados.
- **Dados/Entidades.** `Local(id, nome, tipo, endereco, arquivado)`.
- **Critérios de aceite.**
```gherkin
Cenário: Cadastrar local
  Quando cadastro um local com nome, tipo e endereço
  Então o local é salvo e aparece na listagem ativa
Cenário: Arquivar local
  Quando arquivo um local
  Então ele some das listas ativas
  Mas seu histórico e valor social gerado são preservados
```
- **Dependências.** AC-01.
- **Fora de escopo.** Cadastro de pontos (CA-02); vínculo de Responsável (CA-04); listagem dedicada avançada (VH-01).

---

### CA-02 — Como Gestor, quero cadastrar pontos de coleta dentro de um local, para que cada estação tenha seu QR.

- **Objetivo.** Criar pontos e seus QR Codes.
- **Atores.** Gestor.
- **Pré-condições.** Existir ao menos um Local ativo.
- **Regras.** RN-G-05 (1:N; QR único por ponto; ponto fica com o local). QR gerado no cadastro do ponto e recuperável depois. Um local pode ter vários pontos.
- **Fluxo principal.** Gestor seleciona local → cria ponto → sistema gera QR único → ponto listado com QR disponível.
- **Exceções.** Local inexistente/arquivado → não permite criar ponto. Falha na geração do QR → não persiste ponto sem QR.
- **Dados/Entidades.** `Ponto(id, local_id, qr_code, arquivado)`.
- **Critérios de aceite.**
```gherkin
Cenário: Cadastrar ponto
  Dado um local existente
  Quando cadastro um ponto nesse local
  Então o ponto é criado com um QR Code único
Cenário: Vários pontos por local
  Então um local pode ter vários pontos, cada um com seu QR distinto
```
- **Dependências.** CA-01.
- **Fora de escopo.** Tela dedicada de impressão em lote (OP-01); leitura do QR pelo doador (DG-01).

---

### OP-03 — Como Gestor/Coletor, quero registrar os litros reais recolhidos num ponto, para alimentar o valor social.

- **Objetivo.** Registrar a coleta física com medição real. Versão **simplificada**: sem solicitação/estados.
- **Atores.** Gestor (podendo acumular Coletor).
- **Pré-condições.** Existir um Ponto.
- **Regras.** RN-G-01 (trilho de litros reais), RN-G-12 (litros), RN-G-02 (alimenta o valor social). A coleta fica associada a ponto, data e (quando houver) coletor. Litros reais > 0.
- **Fluxo principal.** Seleciona ponto → informa litros reais e data → salva → coleta entra no total do ponto e alimenta o valor social.
- **Exceções.** Litros ≤ 0 ou data inválida → validação impede. Ponto inexistente → bloqueia.
- **Dados/Entidades.** `Coleta(id, ponto_id, litros_reais, data, coletor_id?)`.
- **Critérios de aceite.**
```gherkin
Cenário: Registrar coleta
  Dado um ponto existente
  Quando registro uma coleta informando os litros reais e a data
  Então a coleta fica associada ao ponto
  E entra no total de litros recolhidos
Cenário: Litros inválidos
  Quando informo litros iguais ou menores que zero
  Então o sistema recusa o registro
```
- **Dependências.** CA-02.
- **Fora de escopo.** Fluxo de solicitação de coleta (OP-02); máquina de estados (OP-04); reconciliação com o declarado (OP-05). *No MVP não há solicitação prévia — registra-se direto.*

---

### IS-01 — Como Gestor, quero que cada litro real vire valor social, para medir o impacto.

- **Objetivo.** Converter litros reais em valor social.
- **Atores.** Gestor.
- **Pré-condições.** Existirem coletas registradas.
- **Regras.** RN-G-02 (R$ 1,00 × litros reais; nunca declarado). Agregação por local e por período. O cálculo ignora doações declaradas.
- **Fluxo principal.** Sistema soma os litros reais das coletas → multiplica por R$ 1,00 → disponibiliza agregados por local/período.
- **Exceções.** Sem coletas → total zero (não erro).
- **Dados/Entidades.** Deriva de `Coleta`. Sem entidade nova obrigatória (agregação calculada).
- **Critérios de aceite.**
```gherkin
Cenário: Valor social por litro real
  Dado coletas registradas
  Então cada litro recolhido gera R$ 1,00 para ações sociais
  E o total é calculado a partir da medição real, não da declaração
```
- **Dependências.** OP-03.
- **Fora de escopo.** Apresentação em painel (IS-02); visão do Responsável (IS-03).

---

### IS-02 — Como Gestor, quero um painel de impacto, para enxergar o total e o detalhamento.

- **Objetivo.** Apresentar o valor social consolidado.
- **Atores.** Gestor.
- **Pré-condições.** IS-01 disponível.
- **Regras.** RN-G-02. Mostra total acumulado e detalhamento por local e período.
- **Fluxo principal.** Gestor acessa o painel → vê total geral → filtra/detalha por local e período.
- **Exceções.** Sem dados → painel exibe zeros e estado vazio.
- **Dados/Entidades.** Consome os agregados de IS-01.
- **Critérios de aceite.**
```gherkin
Cenário: Visão consolidada
  Quando acesso o painel de impacto
  Então vejo o total acumulado e o detalhamento por local e período
```
- **Dependências.** IS-01.
- **Fora de escopo.** Visualizações multi-formato (MF-01x); exportação.

---

### LP-01 — Como visitante, quero entender a proposta e o modelo, para confiar na iniciativa.

- **Objetivo.** Página pública mínima (sem login) com hero e modelo.
- **Atores.** Visitante (não autenticado).
- **Pré-condições.** Nenhuma.
- **Regras.** A página não exige autenticação. Explica o modelo "cada litro soma R$ 1 para causas sociais".
- **Fluxo principal.** Visitante acessa a URL pública → vê hero + CTA → vê a seção do modelo.
- **Dados/Entidades.** Conteúdo estático.
- **Critérios de aceite.**
```gherkin
Cenário: Página pública
  Quando acesso a landing
  Então vejo o hero com a proposta e um CTA, sem precisar de login
  E vejo a explicação do modelo — cada litro soma R$ 1 para causas sociais
```
- **Dependências.** Nenhuma (conteúdo). Idealmente após o deploy (AC-01).
- **Fora de escopo.** Apoiadores (LP-01b), mapa (LP-01d), footer (LP-01e).

---

## Backlog — Épico: Acesso e contas

### AC-02 — Como usuário, quero criar uma conta, para passar a usar o sistema.
- **Objetivo.** Autocadastro.
- **Atores.** Usuário anônimo.
- **Regras.** E-mail único; papel padrão definido pelo Gestor. RN-G-03.
- **Fluxo principal.** Informa nome/e-mail/senha → conta criada com papel padrão.
- **Exceções.** E-mail já existente → aviso, sem duplicar.
- **Dados/Entidades.** `Usuario`.
- **Critérios de aceite.**
```gherkin
Cenário: Criar conta
  Quando informo nome, e-mail e senha válidos
  Então minha conta é criada com o papel padrão
Cenário: E-mail em uso
  Quando o e-mail já existe
  Então recebo aviso e a conta não é duplicada
```
- **Dependências.** AC-01.
- **Fora de escopo.** Verificação por e-mail, recuperação de senha.

### AC-03 — Como Gestor, quero ativar Responsável, Coletor e Doador na interface, para operar com todos os perfis.
- **Objetivo.** Levar o modelo N:N para a interface.
- **Regras.** RN-G-03 (acúmulo permitido). Telas/menus condicionais por papel.
- **Fluxo principal.** Gestor atribui/troca papéis → interface reflete permissões acumuladas.
- **Dados/Entidades.** `UsuarioPapel`.
- **Critérios de aceite.**
```gherkin
Cenário: Acúmulo de papéis
  Quando atribuo Gestor e Coletor à mesma conta
  Então ela acumula as permissões dos dois
```
- **Dependências.** AC-01.
- **Fora de escopo.** Regras finas de escopo de dados (AC-04).

### AC-04 — Como Gestor, quero que cada papel só acesse o que lhe cabe, para proteger os dados de cada local.
- **Objetivo.** Autorização por papel + filtro por escopo.
- **Regras.** Responsável vê apenas locais vinculados; Gestor vê tudo. RN-G-03.
- **Fluxo principal.** Requisição autenticada → guard verifica papel → filtra dados pelo escopo do usuário.
- **Exceções.** Acesso fora do escopo → negado (403), sem vazar existência do recurso.
- **Dados/Entidades.** Usa `UsuarioPapel` e vínculo Responsável↔Local (CA-04).
- **Critérios de aceite.**
```gherkin
Cenário: Responsável só vê seus locais
  Dado que sou Responsável do Local A
  Quando acesso a lista de locais
  Então vejo apenas o Local A
Cenário: Gestor vê tudo
  Dado que sou Gestor
  Então acesso todos os locais, pontos e usuários
```
- **Dependências.** AC-03, CA-04.
- **Fora de escopo.** Autenticação (AC-01).

### AC-05 — Como Doador, quero doar de forma anônima, para controlar minha privacidade.
- **Objetivo.** Preferência de anonimato.
- **Regras.** RN-G-07 (anônima conta p/ local, não p/ ranking).
- **Fluxo principal.** Doador ativa anonimato no perfil → doações passam a não aparecer no ranking individual, mas somam ao total do local.
- **Dados/Entidades.** Campo `anonima`/`preferencia_anonimato` em `Usuario`/`Doacao`.
- **Critérios de aceite.**
```gherkin
Cenário: Doação anônima
  Dado que optei por anonimato
  Então minha doação conta para o total do local
  Mas não aparece no ranking individual
```
- **Dependências.** DG-01, DG-07.
- **Fora de escopo.** Anonimização retroativa de doações passadas (definir se aplica só a novas).

## Backlog — Épico: Cadastros base

### CA-03 — Como Gestor, quero cadastrar usuários e atribuir papéis, para controlar acessos.
- **Objetivo.** CRUD de usuários com papel.
- **Regras.** RN-G-03. E-mail único.
- **Dados/Entidades.** `Usuario`, `UsuarioPapel`.
- **Critérios de aceite.**
```gherkin
Cenário: Cadastrar usuário
  Quando cadastro um usuário com nome, e-mail e papel
  Então o usuário é criado com o papel atribuído
```
- **Dependências.** AC-01. **Fora de escopo.** Autocadastro (AC-02).

### CA-04 — Como Gestor, quero vincular um Responsável a um local, para delegar sua administração.
- **Objetivo.** Vínculo Responsável↔Local.
- **Regras.** Um Responsável pode cobrir >1 local. Base para o filtro de escopo (AC-04). RN-G-06 (soft delete do vínculo).
- **Dados/Entidades.** `VinculoResponsavelLocal(responsavel_id, local_id, ativo)`.
- **Critérios de aceite.**
```gherkin
Cenário: Vincular responsável
  Dado um Responsável e um local
  Quando faço o vínculo
  Então ele passa a administrar apenas esse local
```
- **Dependências.** CA-01, CA-03. **Fora de escopo.** Aplicação do escopo em runtime (AC-04).

## Backlog — Épico: Núcleo operacional

### OP-01 — Como Gestor/Responsável, quero uma tela dedicada de pontos e QRs, para imprimir e fixar nas estações.
- **Objetivo.** Visão focada nos pontos com download de QR.
- **Regras.** RN-G-05.
- **Critérios de aceite.**
```gherkin
Cenário: Visualizar pontos
  Quando acesso um local
  Então vejo seus pontos e o QR de cada um, com opção de baixar
```
- **Dependências.** CA-02. **Fora de escopo.** Geração do QR (CA-02).

### OP-02 — Como Responsável, quero solicitar a coleta de um ponto cheio, para que o óleo seja recolhido.
- **Objetivo.** Abrir solicitação por ponto.
- **Regras.** Solicitação é **por ponto**, não pelo local. Entra em fila com status inicial "Solicitada".
- **Fluxo principal.** Responsável seleciona ponto cheio → solicita → fila recebe a solicitação.
- **Dados/Entidades.** `Solicitacao(id, ponto_id, status, criada_em, ...)`.
- **Critérios de aceite.**
```gherkin
Cenário: Solicitar coleta
  Dado que meu ponto está cheio
  Quando solicito a coleta daquele ponto
  Então a solicitação entra na fila com status "Solicitada"
```
- **Dependências.** CA-02 (e escopo do Responsável, AC-04). **Fora de escopo.** Estados avançados (OP-04); medição (OP-03).

### OP-04 — Como Gestor, quero acompanhar o ciclo de vida da solicitação, para organizar a operação.
- **Objetivo.** Máquina de estados da solicitação.
- **Regras.** Transições: Solicitada → Agendada → Em coleta → Concluída; Cancelada possível antes da conclusão. Conclusão exige medição real (OP-03).
- **Dados/Entidades.** `Solicitacao.status` + histórico de transições.
- **Critérios de aceite.**
```gherkin
Cenário: Ciclo de vida
  Então a solicitação transita: Solicitada → Agendada → Em coleta → Concluída
  E pode ser Cancelada antes da conclusão
Cenário: Conclusão exige medição
  Quando marco como Concluída
  Então deve existir coleta com litros reais registrada
```
- **Dependências.** OP-02, OP-03. **Fora de escopo.** Reconciliação (OP-05).

### OP-05 — Como Gestor, quero comparar o declarado com o medido, para identificar divergências.
- **Objetivo.** Reconciliação declarado × real.
- **Regras.** RN-G-01, RN-G-04 (independência). Compara total declarado validado do ponto/período com litros reais; sinaliza divergência acima de um limiar configurável pelo Gestor.
- **Fluxo principal.** Coleta concluída → sistema soma declarado validado × real → calcula divergência → sinaliza se acima do limiar.
- **Exceções.** Sem doações declaradas → reconciliação apenas informa o real. Coletor = Responsável do local → bloquear/alertar (RN-G-04).
- **Dados/Entidades.** Deriva de `Coleta` e `Doacao`; parâmetro `limiar_divergencia`.
- **Critérios de aceite.**
```gherkin
Cenário: Reconciliar
  Dado doações declaradas validadas e uma coleta com litros reais
  Quando a coleta é concluída
  Então o sistema compara os totais e sinaliza divergência acima do limiar
Cenário: Independência
  Então o Coletor de um ponto não pode validar as doações do mesmo local
```
- **Dependências.** OP-03, DG-02. **Fora de escopo.** Ação punitiva/automática sobre fraude (apenas sinaliza).

## Backlog — Épico: Impacto social

### IS-03 — Como Responsável, quero ver quanto meu local gerou, para engajar os moradores.
- **Objetivo.** Impacto do local para o Responsável. Reusa IS-01.
- **Regras.** RN-G-02; escopo do Responsável (AC-04).
- **Critérios de aceite.**
```gherkin
Cenário: Impacto do local
  Quando acesso meu local
  Então vejo o valor social gerado por ele
```
- **Dependências.** IS-01, AC-04. **Fora de escopo.** Consolidado global (IS-02).

## Backlog — Épico: Visualizações e histórico

### VH-01 — Como Gestor, quero listar todos os locais, para ter visão geral.
- **Regras.** RN-G-06 (só ativos por padrão). Mostra nome, tipo, nº de pontos.
```gherkin
Cenário: Listar locais
  Quando acesso a lista de locais
  Então vejo todos com nome, tipo e nº de pontos
```
- **Dependências.** CA-01. **Fora de escopo.** Edição (CA-01).

### VH-02 — Como Gestor, quero ver o volume por ponto, para acompanhar a operação.
- **Regras.** RN-G-01 (litros reais), por período.
```gherkin
Cenário: Quantidade por ponto
  Quando acesso um ponto
  Então vejo o total de litros reais recolhidos por período
```
- **Dependências.** OP-03. **Fora de escopo.** Valor social (IS-01).

### VH-03 — Como Gestor, quero listar todos os usuários, para administrar acessos.
```gherkin
Cenário: Listar usuários
  Quando acesso a lista de usuários
  Então vejo todos com seus papéis
```
- **Dependências.** CA-03. **Fora de escopo.** Edição de papéis (AC-03/CA-03).

### VH-04 — Como Responsável, quero ver o histórico de entregas do meu local, para acompanhar o desempenho.
- **Regras.** Escopo do Responsável (AC-04); litros reais.
```gherkin
Cenário: Histórico por local
  Quando acesso o histórico
  Então vejo as coletas com data, ponto e litros reais
```
- **Dependências.** OP-03, AC-04.

## Backlog — Épico: Landing page

### LP-01b — Como visitante, quero ver quem apoia o projeto, para confiar na iniciativa.
- Seção institucional de apoiadores/parceiros. Conteúdo estático. **Dependências.** LP-01.

### LP-01d — Como visitante, quero ver onde estão os pontos, para achar o mais próximo.
- **Regras.** RN-G-05; **privacidade**: pontos em locais privados (condomínios) não expõem endereço exato no mapa público — aplicar regra definida pelo Gestor (ex.: mostrar só bairro, ou só pontos públicos).
```gherkin
Cenário: Privacidade
  Dado um ponto em local privado
  Então seu endereço exato não é exposto no mapa público
```
- **Dependências.** CA-02, LP-01. **Fora de escopo.** Roteirização/navegação.

### LP-01e — Como visitante, quero contato e informações institucionais, para falar com a empresa.
- Rodapé com contato, redes e institucional. **Dependências.** LP-01.

## Backlog — Épico: Gamificação

> **Marco.** DG-01 coloca o papel **Doador** em produção. Todo este épico depende do trilho declarado (RN-G-01) e é independente do cálculo de valor social.

### DG-01 — Como Doador, quero declarar minha doação escaneando o QR, para participar da gamificação.
- **Objetivo.** Registrar doação declarada via QR; habilitar o Doador.
- **Regras.** RN-G-01 (declarado), RN-G-10 (geoloc opcional), RN-G-12. A doação nasce "Declarada", pendente de validação. Vincula-se ao ponto (via QR) e ao doador.
- **Fluxo principal.** Doador escaneia QR → informa litros → (opcional) permite geolocalização → doação registrada como Declarada.
- **Exceções.** Geolocalização negada → prossegue (RN-G-10). QR inválido → recusa.
- **Dados/Entidades.** `Doacao(id, ponto_id, doador_id, litros_declarados, status, data, anonima, geoloc?)`.
- **Critérios de aceite.**
```gherkin
Cenário: Declarar doação
  Dado um ponto com QR
  Quando escaneio e informo os litros
  Então a doação é registrada como declarada, pendente de validação
Cenário: Geolocalização opcional
  Quando nego a localização
  Então a doação prossegue normalmente
```
- **Dependências.** CA-02, AC-05 (anonimato). **Fora de escopo.** Validação (DG-02); pontuação (DG-04).

### DG-02 — Como Responsável, quero validar as doações do meu local, para que só doações reais pontuem.
- **Regras.** RN-G-04 (independência); só doações validadas pontuam.
- **Fluxo principal.** Responsável abre fila do local → valida ou rejeita cada doação declarada.
```gherkin
Cenário: Validar
  Quando valido uma doação declarada
  Então ela passa a contar para a gamificação
Cenário: Rejeitar
  Quando rejeito uma doação
  Então ela não gera pontos
```
- **Dependências.** DG-01, AC-04. **Fora de escopo.** Cálculo de pontos (DG-04).

### DG-03 — Como sistema, quero controlar o ciclo de vida da doação, para rastrear sua situação.
- **Regras.** Estados: Declarada → Validada → Contabilizada; ou Declarada → Rejeitada.
```gherkin
Cenário: Ciclo de vida
  Então a doação transita: Declarada → Validada → Contabilizada, ou Rejeitada
```
- **Dependências.** DG-01.

### DG-04 — Como Doador, quero que doações validadas gerem pontos, para subir no ranking.
- **Regras.** RN-G-08 (pontos pertencem ao local; seguem o local; contagem por data). Pontos proporcionais aos litros declarados validados.
```gherkin
Cenário: Pontos seguem o local
  Dado que mudo de condomínio
  Então os pontos anteriores permanecem no local anterior
  E novas doações pontuam para o novo local
```
- **Dependências.** DG-02. **Fora de escopo.** Ordenação/ranking (DG-07).

### DG-05 — Como usuário, quero ser avisado das campanhas, para participar.
- **Regras.** Requer serviço externo de e-mail/push. Disparo no início da campanha.
```gherkin
Cenário: Notificar campanha
  Dado uma campanha criada
  Quando ela inicia
  Então todos os usuários recebem notificação
```
- **Dependências.** DG-06 + serviço externo. **Fora de escopo.** Preferências de notificação por canal.

### DG-06 — Como Gestor, quero criar campanhas com início e fim, para organizar a gamificação.
- **Regras.** A gamificação considera apenas doações dentro do período.
```gherkin
Cenário: Criar campanha
  Quando crio uma campanha com período
  Então a gamificação considera só doações do período
```
- **Dados/Entidades.** `Campanha(id, inicio, fim, ...)`. **Dependências.** DG-04.

### DG-07 — Como Doador, quero ver o ranking da campanha, para acompanhar minha posição.
- **Regras.** RN-G-07 (anônimos fora do ranking individual), RN-G-09 (desempate por quem atingiu primeiro).
```gherkin
Cenário: Ranking
  Quando a campanha está ativa
  Então o ranking ordena os participantes por pontuação
Cenário: Desempate
  Dado empate de pontuação
  Então fica à frente quem atingiu a pontuação primeiro (data)
```
- **Dependências.** DG-04, DG-06.

### DG-08 — Como Gestor, quero levantar quem mais doou no ano, para premiar.
- **Regras.** Levantamento anual dos maiores doadores.
```gherkin
Cenário: Levantamento anual
  Quando gero o levantamento no fim do ano
  Então vejo os top doadores do período
```
- **Dependências.** DG-07.

## Backlog — Épico: Visualizações multi-formato

> Camada de apresentação genérica sobre datasets existentes. MF-01a é a decisão de design que rege as demais.

### MF-01a — Como Gestor, quero definir quais formatos servem a quais dados, para evitar visualizações sem sentido.
- **Regras.** Matriz formato × dataset (tabela, kanban, mapa, agenda) + campos exigidos por formato (kanban exige estado; mapa exige coordenadas; agenda exige data).
- **Dependências.** VH-*. **Fora de escopo.** Os componentes em si (MF-01b..e).

### MF-01b — Como usuário, quero ver dados em tabela, para analisar registro a registro.
- Tabela com ordenação para datasets compatíveis. **Dependências.** MF-01a.

### MF-01c — Como usuário, quero ver dados com estados em kanban, para acompanhar o fluxo.
- Kanban por estado (ex.: solicitações). **Dependências.** MF-01a, OP-04.

### MF-01d — Como usuário, quero ver dados geográficos em mapa, para entender a distribuição.
- Mapa por coordenadas (ex.: pontos). **Dependências.** MF-01a.

### MF-01e — Como usuário, quero ver dados com datas em agenda, para enxergar a linha do tempo.
- Agenda/calendário por data (ex.: coletas). **Dependências.** MF-01a.

---

## 4. Agrupamento sugerido de features para `/speckit.specify`

Cada linha vira uma feature (um `/specify`), reunindo histórias coerentes. A ordem respeita dependências.

| Feature | Histórias | Observação |
|---------|-----------|------------|
| `fundacao-acesso` | AC-01 (+AC-02, AC-03, AC-04 quando entrarem) | Esqueleto, deploy, auth, papéis |
| `cadastro-locais-pontos` | CA-01, CA-02 (+CA-03, CA-04) | Cadastros base + QR |
| `ciclo-de-coleta` | OP-03 (+OP-01, OP-02, OP-04, OP-05) | Medição real; MVP = OP-03 |
| `impacto-social` | IS-01, IS-02 (+IS-03) | Valor social e painel |
| `landing-publica` | LP-01 (+LP-01b, LP-01d, LP-01e) | Página pública |
| `gamificacao` | DG-01…DG-08, AC-05 | Doador em produção + campanhas/ranking |
| `visualizacoes-multiformato` | MF-01a…MF-01e | Camada de apresentação |

> Para o MVP, gere primeiro os specs das features `fundacao-acesso` (só AC-01),
> `cadastro-locais-pontos` (CA-01, CA-02), `ciclo-de-coleta` (OP-03), `impacto-social`
> (IS-01, IS-02) e `landing-publica` (LP-01). As demais histórias entram como evolução.
