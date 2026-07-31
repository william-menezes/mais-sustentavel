<!--
Apresentação do seminário — + Sustentável
Formato: Marp (Markdown → PowerPoint/PDF). Um tópico por slide.

Como gerar o PowerPoint:
  • VS Code: instale a extensão "Marp for VS Code" → abra este arquivo →
    "Export slide deck..." → PPTX (ou PDF).
  • CLI:  npx @marp-team/marp-cli docs/apresentacao-seminario.md --pptx
          npx @marp-team/marp-cli docs/apresentacao-seminario.md --pdf

Dica: o seminário tem no máximo 10 min — ~30s por slide. Ajuste/agrupe se precisar.
-->
---
marp: true
theme: default
paginate: true
size: 16:9
---

<!-- _paginate: false -->

# + Sustentável

### Logística reversa de óleo de cozinha usado
**Cada litro soma — R$ 1,00 por litro para ações sociais.**

William Menezes Damascena (12521BSI233) · Product Owner
FACOM32403 — Processo de Desenvolvimento de Software · UFU · 2026/1

---

## O problema

- Óleo de cozinha descartado na pia **contamina água e solo** (1 L polui milhares de litros de água).
- Ao mesmo tempo, é um resíduo **com valor** (biodiesel, sabão).
- Falta **organização e transparência** na coleta e no destino social.

---

## A solução

- Plataforma web que **organiza a coleta** e **mede o impacto**.
- Cadastro de **locais** e **pontos de coleta** (com QR Code).
- Registro dos **litros reais** recolhidos.
- Conversão automática em **valor social** para causas sociais.

---

## Conceito central: valor social

- **Valor social = R$ 1,00 × litros reais coletados.**
- Calculado **sempre sobre a medição real**, nunca sobre o declarado.
- **Dois trilhos** de medição distintos: doação declarada (gamificação, futuro) × litros reais (valor social).

---

## Papéis e domínio

- Papéis modelados (N:N): **Gestor, Responsável, Coletor, Doador**.
- No MVP, apenas o **Gestor** é ativo; os demais evoluem no backlog.
- **Local 1:N Ponto**; cada ponto tem **QR Code único**.
- **Soft delete** preserva histórico e valor social gerado.

---

## Funcionalidades entregues (MVP)

- **AC-01** — Autenticação por sessão + papéis (RBAC).
- **CA-01** — Cadastrar locais (soft delete).
- **CA-02** — Cadastrar pontos de coleta com QR Code.
- **OP-03** — Registrar coletas (litros reais) + total.
- **IS-01** — Valor social (total, por local, mensal).
- **IS-02 / LP-01** — Painel de impacto e landing pública.

---

## Arquitetura

- **Frontend** (Angular + PrimeNG) → **Vercel**.
- **Backend** (Spring Boot em Docker) → **Render**.
- **Banco** (PostgreSQL + RLS) → **Supabase**.
- Comunicação HTTPS; front faz _proxy_ `/api` → back.

> Diagrama completo na Wiki (página **Arquitetura**).

---

## Componentes e módulos

- **Backend** por domínio: `auth · local · ponto · coleta · impacto · config`.
- Camadas: **controller → service → repository → domínio**.
- **Frontend**: `core` (transversal) · `domain` (features) · `shared`/`widget` (reutilizáveis).

> Diagrama completo na Wiki (página **Componentes**).

---

## Stack tecnológica

- **Java 21 · Spring Boot 4 · Spring Security 7 · JPA · Flyway · ZXing**.
- **Angular 22 (standalone + signals) · PrimeNG**.
- **PostgreSQL + RLS** (Supabase).
- **Docker**, GitHub Actions, Render, Vercel.

---

## Metodologia: Scrum

- **4 sprints** em datas fixas.
- Backlog e scrum board no **Jira**.
- Escopo enxuto e **demonstrável** a cada sprint.
- Story points (Fibonacci) nas subtarefas.

---

## Metodologia: SDD com GitHub Spec Kit

- **Spec-Driven Development**: a **intenção é a fonte da verdade**.
- Pipeline por história: **Constitution → specify → clarify → plan → tasks → analyze → implement**.
- Artefatos versionados em `specs/NNN-slug/`.
- Rastreabilidade história ↔ spec ↔ tasks ↔ Jira.

---

## Testes e qualidade (TDD)

- **TDD inegociável**: teste antes do código (Red → Green → Refactor).
- **Backend**: JUnit 5 + **Testcontainers** (PostgreSQL real, no Docker).
- **Frontend**: **Vitest**.
- **CI** é o guardião: nada mescla com teste vermelho.

---

## DevOps: Gitflow e CI/CD

- Três branches: **develop → homolog → main** (produção).
- Toda promoção por **Pull Request com CI verde**.
- **GitHub Actions**: jobs Backend (API) e Frontend (Web).
- **Deploy contínuo**: Render (API) e Vercel (front).

---

## Segurança (baseline)

- Sessão por cookie **HttpOnly** + **CSRF** _double-submit_.
- **CORS** restrito; **HTTPS** ponta a ponta.
- **RLS** no banco (Supabase).
- Validação de entrada; segredos só em variáveis de ambiente.

---

## Números do projeto

- **4 sprints**; kick-off em 22/06.
- Escopo comprometido: **52 pontos**; backlog total do produto: **158 pontos**.
- **8+ histórias** no backlog (requisito da disciplina), quebradas em subtarefas.
- Cerimônias: planning, review por sprint.

---

## Demonstração

- Login do Gestor.
- Cadastrar **local** → **ponto** (QR gerado).
- Registrar **coletas** (litros reais) → total do ponto.
- **Valor social**: total, por local e série mensal.

> _(software funcionando ao vivo)_

---

## Transbordos e backlog futuro

- Fluxo do **Doador** (doação via QR), **gamificação** e **ranking**.
- **Reconciliação** anti-fraude (litros reais × declarado).
- Visualizações multi-formato (tabela, kanban, mapa, agenda).
- Implementação plena dos **4 papéis** e controle de acesso por escopo.

---

## Lições aprendidas

- **SDD + TDD** dão previsibilidade e reduzem retrabalho.
- **CI como guardião** evita regressões e "quebra" na main.
- **Segurança desde o desenho** (não como camada posterior).
- Escopo **enxuto e demonstrável** > tentar entregar tudo.

---

## Conclusão

- MVP funcional que **mede impacto social real** da coleta.
- Base sólida (arquitetura, testes, DevOps) pronta para evoluir.
- Processo disciplinado (Scrum + SDD + TDD) como diferencial.

**Obrigado!**
Repositório e Wiki: `github.com/william-menezes/mais-sustentavel`
