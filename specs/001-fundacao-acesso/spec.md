# Especificação de Feature: Fundação de Acesso (AC-01)

**Feature Branch**: `001-fundacao-acesso`

**Criada em**: 2026-07-27

**Status**: Rascunho

**Entrada**: história AC-01 — "Como Gestor, quero entrar no sistema sobre uma base já implantada e com os papéis modelados, para administrar a operação."

---

## Cenários de Usuário e Testes *(obrigatório)*

### História 1 — Papéis e Gestor modelados no banco (Prioridade: P1)

Como time do produto, queremos que os **quatro papéis do domínio** e ao menos um **Gestor** existam no banco desde o início: o sistema registra os papéis Gestor, Responsável, Coletor e Doador, associa usuários a papéis em relação **muitos-para-muitos** (um usuário pode acumular papéis) e marca **apenas o Gestor como utilizável no MVP**; os demais permanecem modelados, porém inativos.

**Por que esta prioridade**: é a fundação de dados de toda a operação administrativa — sem ela não há login nem administração. Modelar os quatro papéis agora evita reescrita futura (papéis previstos entram no banco antes da interface).

**Teste independente**: inspecionar o estado do banco — existem exatamente os quatro papéis nomeados; existe ao menos um Gestor; um mesmo usuário pode estar associado a mais de um papel. Entrega valor por si só (o critério "papéis modelados" da história).

**Cenários de Aceite**:

1. **Dado** o sistema recém-implantado, **Quando** o banco é inicializado, **Então** existem os papéis Gestor, Responsável, Coletor e Doador.
2. **Dado** os papéis existentes, **Então** apenas o Gestor está habilitado para uso na interface do MVP; os demais permanecem modelados e inativos.
3. **Dado** um usuário, **Quando** recebe mais de um papel, **Então** acumula todos (relação N:N).
4. **Dado** o seed inicial, **Então** existe ao menos uma conta de Gestor apta a autenticar.

---

### História 2 — Gestor entra no sistema (Prioridade: P1)

Como **Gestor**, quero autenticar com e-mail e senha, para acessar a área administrativa carregando meu papel.

**Por que esta prioridade**: é o valor interativo da AC-01 — sem login não há administração. Depende da História 1 (dados).

**Teste independente**: autenticar com credenciais corretas (acessa a área administrativa) e incorretas (erro genérico, permanece deslogado), verificando que a sessão carrega o papel do usuário.

**Cenários de Aceite**:

1. **Dado** que sou o Gestor cadastrado, **Quando** informo e-mail e senha corretos, **Então** acesso o sistema autenticado, com meu papel ativo disponível na sessão.
2. **Quando** informo credenciais incorretas, **Então** recebo mensagem de erro genérica e permaneço deslogado.
3. **Dado** um e-mail não cadastrado, **Quando** tento autenticar, **Então** recebo a mesma mensagem genérica (sem revelar se a conta existe).
4. **Quando** encerro a sessão (logout), **Então** perco o acesso à área administrativa.

---

### Edge Cases

- E-mail inexistente vs. senha incorreta → resposta **idêntica** (anti-enumeração de usuários).
- Usuário sem nenhum papel → autentica, mas não alcança áreas que exijam papel (no MVP, sem Gestor não há acesso administrativo).
- Usuário com múltiplos papéis (ex.: Gestor + Coletor) → a sessão carrega todos.
- Excesso de tentativas de login → limitado (rate limiting) para mitigar força bruta.
- Papel inativo (Responsável/Coletor/Doador) referenciado pela interface → indisponível no MVP.

## Requisitos *(obrigatório)*

### Requisitos Funcionais

- **FR-001**: O sistema DEVE modelar quatro papéis nomeados: **Gestor, Responsável, Coletor e Doador**.
- **FR-002**: O sistema DEVE relacionar usuários e papéis em **muitos-para-muitos**, permitindo que um usuário acumule papéis.
- **FR-003**: No MVP, apenas o papel **Gestor** DEVE estar ativo/utilizável na interface; os demais permanecem modelados e inativos.
- **FR-004**: Desde a inicialização, DEVEM existir os quatro papéis e ao menos uma conta de **Gestor** (seed).
- **FR-005**: Cada usuário DEVE ter, no mínimo, nome, e-mail (**único**) e senha armazenada de forma protegida (hash forte; nunca em texto puro).
- **FR-006**: O sistema DEVE autenticar por e-mail e senha e, na sessão autenticada, disponibilizar o(s) papel(is) do usuário.
- **FR-007**: Em falha de autenticação (senha incorreta OU conta inexistente), o sistema DEVE responder com **mensagem genérica**, sem revelar qual campo falhou nem se a conta existe.
- **FR-008**: O sistema DEVE permitir encerrar a sessão (**logout**).
- **FR-009** *(segurança)*: O acesso aos dados de usuários e papéis DEVE ser restringido na **camada de dados** (isolamento em nível de linha), não dependendo apenas da aplicação.
- **FR-010** *(segurança)*: O fluxo de autenticação DEVE ter **limitação de taxa** (rate limiting) para mitigar força bruta.
- **FR-011** *(segurança)*: Segredos (credenciais de banco, chaves) DEVEM residir apenas em **variáveis de ambiente**, nunca versionados.
- **FR-012**: Todos os textos de interface e mensagens DEVEM estar em **português do Brasil**.

### Entidades-Chave *(dados envolvidos)*

- **Usuario**: pessoa que acessa o sistema. Atributos: identificador, nome, e-mail (único), senha protegida. Relaciona-se N:N com Papel.
- **Papel**: função no domínio (Gestor, Responsável, Coletor, Doador). Atributos: identificador, nome; indicação de ativo/inativo no MVP.
- **UsuarioPapel**: associação N:N entre Usuario e Papel — um usuário pode ter vários papéis; um papel pode pertencer a vários usuários.

## Success Criteria *(obrigatório)*

### Measurable Outcomes

- **SC-001**: Os quatro papéis (Gestor, Responsável, Coletor, Doador) existem no sistema e são verificáveis; **apenas o Gestor** é utilizável na interface do MVP.
- **SC-002**: Uma conta de Gestor semeada autentica e alcança a área administrativa em **100%** das tentativas com credenciais corretas.
- **SC-003**: Login com senha incorreta e com conta inexistente produzem respostas **indistinguíveis** (mesma mensagem e comportamento) — **0%** de vazamento sobre a existência de conta.
- **SC-004**: Um usuário pode possuir simultaneamente **mais de um papel**, comprovável pelos dados.
- **SC-005**: Tentativas de login acima do limite definido são bloqueadas/atrasadas (rate limiting ativo).

## Assumptions

- A fundação técnica (containerização, hospedagem e banco gerenciado) já está implantada e operacional (subtarefas 1 e 2 da AC-01, concluídas no kickoff/deploy).
- A primeira etapa priorizada é a **modelagem de dados** (História 1); autenticação e tela de login (História 2 / subtarefas 4 e 5) vêm na sequência, dentro desta feature.
- O mecanismo de sessão segue padrão adequado para aplicação web (decisão de "como", no plano).
- "Papel ativo" no MVP é uma propriedade dos dados/regra da feature; a forma de representá-lo é decidida no plano.

## Fora de Escopo

- Autocadastro de usuários (AC-02).
- Recuperação/redefinição de senha.
- Atribuição e uso na interface dos papéis Responsável, Coletor e Doador (AC-03).
- Controle de acesso por escopo de dados / filtro por vínculo (AC-04).