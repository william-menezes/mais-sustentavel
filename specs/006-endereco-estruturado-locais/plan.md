# Implementation Plan: Endereço estruturado e visão geral de Locais

**Branch**: `006-endereco-estruturado-locais` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-endereco-estruturado-locais/spec.md`

## Summary

Decompor o endereço do Local em sete componentes (CEP, rua, número, complemento, bairro, cidade, UF), com preenchimento automático por CEP, e reconstruir a tela de Locais como visão geral filtrável coluna a coluna, com cadastro e edição em painel lateral sobreposto.

A abordagem técnica em uma frase por frente:

- **Banco**: migração V6 no padrão *expand* — colunas novas nullable, texto livre preservado em `endereco_legado`, obrigatoriedade validada no servidor (D1).
- **API**: mesma superfície de endpoints da CA-01; muda apenas a representação do endereço no corpo, com Bean Validation por componente.
- **CEP**: consulta ao ViaCEP direto do navegador, sem credenciais e com timeout, tratada como conveniência degradável (D3).
- **Tela**: `p-table` com menu de funil por coluna (D4), conjunto completo carregado e filtro de situação semeado em "ativo" (D5, D7), litros vindos do agregado de impacto já existente (D6).
- **Reuso**: o painel de cadastro nasce como componente compartilhado em `widget/`, porque as mesmas três regras de UI valem para Pontos e Coletas (D8).

## Technical Context

**Language/Version**: Java 21 (backend) · TypeScript 6 / Angular 22 (frontend)

**Primary Dependencies**: Spring Boot 4.1 (Web, Data JPA, Security, Validation) · Flyway · PrimeNG 22 · RxJS 7.8. **Nenhuma dependência nova** — a consulta de CEP usa o `HttpClient` já presente (D3)

**Storage**: PostgreSQL. Supabase em homologação e produção, Postgres em container no desenvolvimento. Schema governado por Flyway; Hibernate em `ddl-auto: validate`

**Testing**: JUnit 5 + Testcontainers rodando em Docker (Art. 1.6 / 5.3) · Vitest com `HttpTestingController` no frontend

**Target Platform**: API em container na Render · SPA na Vercel, com `/api/*` reescrito para a Render (mesma origem)

**Project Type**: aplicação web — API em camadas + SPA desacoplada

**Performance Goals**: filtragem no cliente sobre dezenas de locais, sem paginação no servidor. Consulta de CEP com timeout de 5 s, degradando sem bloquear

**Constraints**: nenhum endereço já cadastrado pode ser perdido (FR-008) · indisponibilidade do ViaCEP não impede cadastro (FR-013) · cookie de sessão e token CSRF nunca saem para domínio externo (Art. 7.4) · formulário utilizável a partir de 360 px (SC-008)

**Scale/Scope**: uma tela reconstruída, um componente compartilhado novo, uma migração, sete campos novos no contrato. 13 arquivos de teste do backend referenciam `endereco` e serão reescritos na fase Red

## Constitution Check

*GATE: aprovado antes da Fase 0 e reavaliado após a Fase 1.*

| Artigo | Exigência | Situação |
|---|---|---|
| 1.1 | Camadas `controller → service → repository → domínio`; regra no serviço | **OK** — validação nos DTOs, regra de negócio permanece no `LocalService` |
| 1.2 | Postgres gerenciado com RLS | **OK** — V6 não desabilita RLS |
| 1.3 | Angular + PrimeNG, design system de `docs/design.md` | **OK** — componentes PrimeNG, tokens existentes |
| 1.4 | Modelagem preparada para o futuro | **OK** — endereço estruturado é pré-requisito de roteirização e do mapa (LP-01d) |
| 1.6 | Java só em Docker | **OK** — build e testes em container |
| 2.6 | Soft delete de Local | **OK** — `arquivado` intacto |
| 3.2 | Spec sem tecnologia | **OK** — verificado no checklist da spec; escolhas técnicas vivem aqui e em `research.md` |
| 3.3 | Critérios de aceite em Gherkin | **OK** — 25 cenários na spec |
| 3.4 | `/speckit-analyze` antes de implementar | **Pendente** — próximo passo do fluxo |
| 5.1 / 5.2 | TDD; teste antes de produção | **A garantir em `tasks.md`** — as tarefas de teste precisam anteceder as de implementação |
| 7.2 | RLS em tabelas com dado sensível | **OK** — mantida na `local` |
| 7.4 | Segredos e credenciais fora do versionamento e fora de terceiros | **OK** — chamada ao ViaCEP sem `withCredentials` (D3) |
| 7.6 | Validação em toda fronteira da API | **OK na aplicação**, com ressalva registrada em Complexity Tracking |
| 8.1 | Artefatos em pt-BR | **OK** |

**Nenhum gate reprovado.** Uma tensão registrada abaixo.

## Project Structure

### Documentation (this feature)

```text
specs/006-endereco-estruturado-locais/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — D1 a D10 e riscos
├── data-model.md        # Fase 1 — tabela, entidade, DTOs, interfaces
├── quickstart.md        # Fase 1 — roteiro de validação
├── contracts/
│   └── locais.md        # Fase 1 — contrato revisado de /api/locais
├── checklists/
│   └── requirements.md  # Qualidade da spec
└── tasks.md             # Fase 2 — gerado por /speckit-tasks
```

### Source Code (repository root)

```text
api/src/main/
├── java/br/com/maissustentavel/api/local/
│   ├── domain/Local.java                    # troca endereco pelos 7 componentes
│   ├── domain/Uf.java                       # NOVO — enum das 27 siglas
│   ├── repository/LocalRepository.java      # inalterado
│   ├── service/LocalService.java            # ajusta cadastro/edição
│   └── web/dto/
│       ├── LocalRequest.java                # NOVO formato + Bean Validation
│       └── LocalResponse.java               # NOVO formato
└── resources/db/migration/
    └── V6__endereco_estruturado.sql         # NOVO — expand + preservação do legado

api/src/test/java/br/com/maissustentavel/api/
├── local/{LocalRepositoryTest,LocalServiceTest,LocalControllerTest}.java   # reescritos (Red)
├── ponto/{PontoRepositoryTest,PontoServiceTest,PontoControllerTest}.java   # fixtures de Local
├── coleta/{ColetaRepositoryTest,ColetaServiceTest,ColetaControllerTest}.java
├── impacto/{ImpactoRepositoryTest,ImpactoServiceTest,ImpactoControllerTest}.java
└── SecurityCsrfTest.java

frontend/src/app/
├── domain/local/
│   ├── apis/local.api.ts                    # payload novo
│   ├── apis/cep.api.ts                      # NOVO — ViaCEP, sem credenciais
│   ├── interfaces/local.interface.ts        # componentes separados + Uf
│   ├── constants/uf.constant.ts             # NOVO — UFS
│   ├── components/local-form/               # sai do p-dialog, passa a viver no drawer
│   ├── components/local-detalhe/            # NOVO — ficha somente leitura (US5)
│   └── pages/locais/                        # tabela com menu de funil, contador, Ver detalhes
├── domain/impacto/
│   ├── apis/impacto.api.ts                  # NOVO — valor-social/por-local
│   └── interfaces/impacto.interface.ts      # NOVO — ValorSocialLocal
├── shared/services/viewport/                # NOVO — signal de largura de viewport
└── widget/components/form-drawer/           # NOVO — painel compartilhado (form e ficha)
```

**Structure Decision**: nada de novo estruturalmente — a feature ocupa as camadas que o refactor de arquitetura já estabeleceu. O backend segue pacote por domínio (`local/{domain,repository,service,web}`). No frontend, dado de domínio fica em `domain/local/` e `domain/impacto/`, e o painel de cadastro vai para `widget/components/` porque é UI **sem conhecimento de domínio** — é o que permite Pontos e Coletas reaproveitá-lo sem depender de Local.

Quatro observações sobre o alcance real:

- **`domain/impacto/apis/` é criado agora**, mas o domínio `impacto` já existia no frontend desde o refactor (com a página do painel). A feature só acrescenta a camada de acesso a dados que faltava.
- **Os testes de Ponto, Coleta e Impacto entram na fase Red** não porque mudam de comportamento, mas porque constroem `Local` como *fixture*. É custo de propagação do modelo, não de regra nova — e por isso são reescritos mecanicamente.
- **`shared/services/viewport/` não estava previsto.** A consulta de mídia saiu do componente porque o jsdom não implementa `matchMedia`: sem essa camada, todo spec que renderizasse um componente responsivo precisaria instalar um stub global.
- **A US5 (ficha do local) entrou depois** do plano original e do gate `/speckit-analyze`. Ela não adiciona camada nova: reaproveita o `form-drawer`, que passa a aceitar fechamento pelo X e rodapé projetado, e consome endpoints existentes. As decisões técnicas dela estão em `research.md` D11.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Colunas de endereço **nullable** no banco, com obrigatoriedade só na aplicação — o banco deixa de ser segunda linha de defesa (tensiona Art. 7.6) | `NOT NULL` exigiria inventar CEP, número, bairro, cidade e UF para os locais legados. Valor sentinela é dado falso que se propaga a relatórios e, na UF, quebraria a lista fechada. O texto original fica preservado e auditável em `endereco_legado` | `NOT NULL` com sentinela: mente sobre o dado. `NOT NULL` com a migração falhando se houver linhas: inviabiliza `mvn verify` em base com dados. Descartar as linhas: viola FR-008. O endurecimento fica como migração futura (fase *contract*), registrada em `research.md` D1 e em `data-model.md` |
| Mudança **incompatível** no contrato de `/api/locais` — o campo `endereco` desaparece de requisição e resposta | O endereço estruturado é o objetivo da feature; manter o campo antigo em paralelo significaria duas fontes de verdade para o mesmo dado | Versionar a API (`/v2`) ou aceitar os dois formatos: o único consumidor é o frontend deste repositório, versionado no mesmo commit. Versionamento aqui seria cerimônia sem consumidor |
