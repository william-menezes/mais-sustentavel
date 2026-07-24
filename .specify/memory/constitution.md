# Constituição do Projeto — + Sustentável

> Princípios inegociáveis do projeto, no sentido do GitHub Spec Kit.
> Este arquivo é a fonte estável que `/speckit-specify`, `/speckit-plan` e `/speckit-tasks`
> consultam para manter todo artefato alinhado. Alterar aqui é uma decisão de peso — muda o
> comportamento de tudo que vem depois.

---

## Preâmbulo

A intenção é a fonte da verdade. O código serve à especificação, não o contrário. Toda mudança de
comportamento começa por atualizar o spec/plan; a implementação decorre disso.

---

## Artigo 1 — Arquitetura

1.1 O backend é **orientado a objetos, em camadas** (Java/Spring): `controller → service → repository → domínio`. A lógica de negócio vive na camada de serviço/domínio, nunca no controller.

1.2 A **API** é **containerizada com Docker** e hospedada na **Render**. O banco de dados é **PostgreSQL gerenciado pelo Supabase**, com **RLS (Row-Level Security)** habilitado como camada de proteção de dados. O Postgres local (via `docker-compose`) serve apenas ao desenvolvimento; Supabase é o banco de homologação e produção.

1.3 O **frontend web** é uma SPA **Angular + PrimeNG**, desacoplada, hospedada na **Vercel**, que consome a API. O visual segue o design system em `docs/design.md` (tokens de cor, tipografia Poppins/Inter, espaçamento e componentes).

1.4 **Modelagem preparada para o futuro:** entidades e papéis previstos são modelados no banco antes de serem implementados na interface, para evitar reescrita posterior.

1.5 O **deploy é contínuo desde cedo:** o esqueleto (Spring + Docker + Render + Supabase) sobe já na primeira sprint de desenvolvimento; todo incremento seguinte nasce publicável.

1.6 **Java vive apenas no ambiente Docker.** Não há JDK no host de desenvolvimento: build, testes e execução da API ocorrem em containers (Dockerfile multi-stage). O esqueleto do projeto Spring é gerado via Spring Initializr.

---

## Artigo 2 — Domínio (invariantes)

2.1 **Dois trilhos de medição.** Doação *declarada* (base da gamificação) e *litros reais coletados* (base do valor social e da reconciliação) são grandezas distintas. Toda feature que toca quantidade respeita os dois trilhos.

2.2 **Valor social = R$ 1,00 por litro real coletado.** Sempre calculado sobre a medição real, nunca sobre o declarado.

2.3 **Papéis:** Gestor, Responsável, Coletor e Doador, em relação **N:N** (`usuario_papel`). O MVP ativa apenas o Gestor; os demais permanecem modelados (ver 1.4). Um usuário pode acumular papéis (ex.: Gestor também Coletor).

2.4 **Independência anti-fraude:** o Coletor de um ponto não pode ser o Responsável que valida as doações do mesmo local.

2.5 **Local 1:N Ponto.** Cada ponto de coleta possui um **QR Code único**.

2.6 **Soft delete** para Local, Ponto e vínculo de Responsável: o item sai das listas ativas, mas o histórico e o valor social gerado são preservados.

2.7 **Doação anônima** conta para o total do local, nunca para o ranking individual.

2.8 **Pontos de gamificação pertencem ao local.** Se o Doador muda de local, os pontos gerados antes permanecem no local anterior; novas doações pontuam para o novo.

2.9 **Desempate no ranking:** vence quem atingiu a pontuação primeiro (pela data da doação).

---

## Artigo 3 — Processo (Spec-Driven Development)

3.1 Fluxo: **Constitution → Spec → Plan → Tasks → Implement.**

3.2 O **spec** descreve o "o quê" e o "por quê" **sem fixar tecnologia**. O stack e o "como" vivem no **plan** e nesta constituição.

3.3 Critérios de aceite são sempre escritos em **Gherkin** (Dado / Quando / Então).

3.4 Rodar **`/speckit-analyze`** antes de `/speckit-implement`, como gate de consistência entre spec, plan e tasks.

3.5 Uma **feature** agrupa histórias coerentes (ex.: cadastro de locais e pontos). Mantém-se a rastreabilidade: história ↔ feature spec ↔ `tasks.md` ↔ subtarefa no Jira.

3.6 **Só se escreve o spec quando o contexto está 100% entendido.** Diante de ambiguidade, registra-se `[NEEDS CLARIFICATION]` (ou roda-se `/speckit-clarify`) em vez de assumir. As regras transversais do domínio (RN-G-\*) prevalecem sobre suposições.

---

## Artigo 4 — Gestão do projeto (disciplina PDS)

4.1 Scrum com **4 sprints em datas fixas**; scrum board de 3 colunas (pendentes · em andamento · concluídos), gerido no **Jira**.

4.2 Toda história de uma sprint é quebrada em **subtarefas**; os **story points ficam nas subtarefas** (escala Fibonacci).

4.3 **Conclusão total não é requisito.** Um backlog rico, bem descrito e bem dividido em sprints é entregável avaliado por si só.

4.4 O **escopo comprometido é enxuto e demonstrável** a cada sprint (a "espinha" do produto). Gamificação e visualizações multi-formato permanecem no backlog como evolução.

4.5 A **entrega final reporta**: estado atual do backlog, o que não deu tempo de implementar (transbordo) e os planos futuros.

---

## Artigo 5 — Qualidade e Testes (TDD, INEGOCIÁVEL)

5.1 **Test-Driven Development é obrigatório**, tanto no backend quanto no frontend. Ciclo estrito **Red → Green → Refactor**: escreve-se o teste, vê-se ele falhar, implementa-se o mínimo para passar, refatora-se.

5.2 **Nenhum código de produção é escrito antes do teste que o cobre.** Em cada `tasks.md`, as tarefas de teste antecedem as de implementação.

5.3 Os **testes do backend rodam dentro do Docker** (stage de teste do Dockerfile / `docker compose run`), coerente com 1.6. Os testes do frontend rodam via `npm test` (Angular/Karma ou Jest).

5.4 Critérios de aceite em Gherkin (3.3) são a fonte dos testes de aceitação/integração de cada história.

5.5 Um incremento só é considerado "pronto" quando seus testes passam no CI.

---

## Artigo 6 — Fluxo de branches e entregas

6.1 Três branches permanentes: **`develop`** (integração), **`homolog`** (homologação) e **`main`** (produção). `main` é a branch padrão e protegida.

6.2 Cada spec/história nasce em uma **branch de feature** (criada pelo Spec Kit, ex.: `NNN-slug-da-feature`), a partir de `develop`.

6.3 Promoção por etapas, sempre via Pull Request com CI verde:
- feature → **`develop`** após a feature ser validada;
- `develop` → **`homolog`** após os testes de integração;
- `homolog` → **`main`** após a homologação.

6.4 Nada é mesclado com testes falhando (ver Artigo 5). Merge direto em `homolog`/`main` sem passar por `develop` é proibido, salvo hotfix documentado.

---

## Artigo 7 — Segurança (baseline)

7.1 **Toda especificação considera segurança desde o desenho**, não como camada posterior. O spec de cada história lista seus requisitos de segurança aplicáveis.

7.2 **RLS no Supabase:** tabelas com dados sensíveis ou multi-tenant têm Row-Level Security habilitada; o acesso é filtrado pelo papel e escopo do usuário (base para AC-04). A API nunca depende só da camada de aplicação para isolar dados.

7.3 **Rate limiting** nos endpoints públicos e de autenticação, para mitigar abuso e força bruta.

7.4 **Autenticação e sessão:** senhas com hash forte; mensagens de erro genéricas que não permitem enumeração de usuários (ver AC-01); segredos apenas em variáveis de ambiente, nunca versionados.

7.5 **Cabeçalhos e transporte:** HTTPS ponta a ponta, cabeçalhos de segurança (HSTS, X-Content-Type-Options, etc.) e **CORS** restrito às origens conhecidas.

7.6 **Validação de entrada** em toda fronteira da API; parametrização de consultas (sem SQL dinâmico concatenado).

---

## Artigo 8 — Idioma

8.1 Todos os artefatos — constituição, specs, plans, tasks, histórias, código de interface e relatório — são escritos em **português do Brasil**.

---

**Version**: 1.0.0 | **Ratified**: 2026-07-24 | **Last Amended**: 2026-07-24