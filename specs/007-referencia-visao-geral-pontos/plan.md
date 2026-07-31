# Implementation Plan: Referência da estação e visão geral de Pontos de coleta

**Branch**: `007-referencia-visao-geral-pontos` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-referencia-visao-geral-pontos/spec.md`

## Summary

Dar identidade a cada estação física — uma **referência** curta que diz onde ela fica dentro do local —
e construir a visão geral de Pontos de coleta que hoje não existe, com cadastro, ficha e criação de
local encadeada em painéis sobrepostos.

A abordagem técnica em uma frase por frente:

- **Banco**: migração V7 no padrão *expand* — coluna `referencia` nullable com limite por CHECK,
  porque as estações já cadastradas não têm valor e inventar um foi recusado (D1).
- **API**: três mudanças no contrato de Ponto — corpo no cadastro, `referencia` e `localNome` na
  resposta, e coleção global `/api/pontos` que não existia em forma nenhuma (D2, D3).
- **Indicadores da ficha**: vêm da consulta de coletas que a ficha já precisa fazer — o **total já chega
  somado do servidor** (`totalLitros`), e só a média é derivada na tela. Nenhum agregado novo, e os
  números não podem divergir do histórico exibido logo abaixo deles (D5).
- **Tela**: uma única `p-table` dona do estado de filtro nos dois modos de visualização, com o corpo
  alternando entre linhas e grade de cartões (D6).
- **Reuso**: o painel compartilhado, o formulário de Local e a ficha de Local vêm da 006 sem
  duplicação. O painel de novo ponto já existe e é estendido, não reescrito (D7, D9).

## Technical Context

**Language/Version**: Java 21 (backend) · TypeScript 6 / Angular 22 (frontend)

**Primary Dependencies**: Spring Boot 4.1 (Web, Data JPA, Security, Validation) · Flyway · PrimeNG 22
· RxJS 7.8. **Nenhuma dependência nova** — o autocomplete e a alternância de visualização usam
componentes PrimeNG já presentes no pacote

**Storage**: PostgreSQL. Supabase em homologação e produção, Postgres em container no desenvolvimento.
Schema governado por Flyway; Hibernate em `ddl-auto: validate`. Última migração aplicada: `V6`

**Testing**: JUnit 5 + Testcontainers rodando em Docker (Art. 1.6 / 5.3) · Vitest com
`HttpTestingController` no frontend

**Target Platform**: API em container na Render · SPA na Vercel, com `/api/*` reescrito para a Render
(mesma origem)

**Performance Goals**: filtragem e alternância de visualização no cliente sobre dezenas de estações,
sem paginação no servidor. A ficha de uma estação faz **uma** consulta de coletas e monta os três
indicadores da resposta dela — nenhuma consulta por linha

**Constraints**: nenhuma estação já cadastrada pode ser perdida ou ganhar rótulo inventado (FR-012) ·
o endereço copiado do QR é sempre o completo, mesmo exibido abreviado (FR-031) · a obrigatoriedade da
referência é garantida no servidor (FR-018 / Art. 7.6) · telas utilizáveis a partir de 360 px (FR-053)
· orçamento de bundle com aviso em 560 kB, hoje em 514.69 kB — a tela nova vive em chunk sob demanda

**Scale/Scope**: uma tela nova, uma rota morta consertada, uma tela removida, um campo novo no modelo,
duas operações novas na API e uma alterada. Os arquivos de teste do backend que constroem `Ponto` como
fixture serão reescritos na fase Red

## Constitution Check

*GATE: aprovado antes da Fase 0 e reavaliado após a Fase 1.*

| Artigo | Exigência | Situação |
|---|---|---|
| 1.1 | Camadas `controller → service → repository → domínio`; regra no serviço | **OK** — validação nos DTOs, normalização e regra no `PontoService` |
| 1.2 | Postgres gerenciado com RLS | **OK** — V7 não desabilita RLS na `ponto` |
| 1.3 | Angular + PrimeNG, design system de `docs/design.md` | **OK** — componentes PrimeNG e os três padrões já registrados |
| 1.4 | Modelagem preparada para o futuro | **OK** — a referência é pré-requisito da folha de adesivos e da roteirização por estação |
| 1.6 | Java só em Docker | **OK** — build e testes em container |
| 2.5 | Local 1:N Ponto, QR único | **OK** — a edição **não** permite mover a estação de local (D3) |
| 2.6 | Soft delete de Ponto | **OK** — `arquivado` intacto; a visão geral respeita RN-G-06 |
| 3.2 | Spec sem tecnologia | **OK** — verificado no checklist da spec; escolhas técnicas vivem aqui e em `research.md` |
| 3.3 | Critérios de aceite em Gherkin | **OK** — 33 cenários na spec |
| 3.4 | `/speckit-analyze` antes de implementar | **Pendente** — próximo passo do fluxo, depois de `/speckit-tasks` |
| 5.1 / 5.2 | TDD; teste antes de produção | **A garantir em `tasks.md`** — pares Red→Green explícitos |
| 7.2 | RLS em tabelas com dado sensível | **OK** — mantida na `ponto` |
| 7.4 | Segredos fora do versionamento | **OK** — nenhuma variável nova |
| 7.6 | Validação em toda fronteira da API | **OK na aplicação**, com ressalva registrada em Complexity Tracking |
| 8.1 | Artefatos em pt-BR | **OK** |

**Nenhum gate reprovado.** Duas tensões registradas abaixo.

### Reavaliação após a Fase 1

O desenho não introduziu violação nova, e trouxe **duas confirmações** que valem registro:

- **Art. 2.5 ficou mais forte, não mais fraco.** A operação de edição nasceu recusando a troca de local
  (D3). Se o corpo aceitasse `localId`, mover uma estação reescreveria o histórico de coletas de dois
  locais — inclusive valor social já publicado. O desenho fecha essa porta antes de ela existir.
- **Art. 7.6 aparece duas vezes na mesma decisão.** A referência é validada no DTO **e** normalizada no
  serviço antes de persistir, porque a coluna aceita nulo: sem o `trim` com recusa de string em branco,
  um `"   "` viraria nulo legítimo e furaria a obrigatoriedade por dentro. Validar sem normalizar teria
  passado no gate e deixado o furo (D4).

A tensão de `nullable` no banco com obrigatoriedade na aplicação **permanece** e continua registrada em
Complexity Tracking — o desenho não a resolve, apenas a delimita.

## Project Structure

### Documentation (this feature)

```text
specs/007-referencia-visao-geral-pontos/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — D1 a D13 e riscos
├── data-model.md        # Fase 1 — tabela, entidade, DTOs, interfaces
├── quickstart.md        # Fase 1 — roteiro de validação
├── contracts/
│   └── pontos.md        # Fase 1 — contrato revisado de Ponto
├── checklists/
│   └── requirements.md  # Qualidade da spec
└── tasks.md             # Fase 2 — gerado por /speckit-tasks
```

### Source Code (repository root)

```text
api/src/main/
├── java/br/com/maissustentavel/api/ponto/
│   ├── domain/Ponto.java                     # ganha referencia
│   ├── repository/PontoRepository.java       # consulta global ordenada
│   ├── service/PontoService.java             # normaliza, cadastra com corpo, edita
│   └── web/
│       ├── PontoController.java              # GET /api/pontos e PUT /api/pontos/{id}
│       └── dto/
│           ├── PontoRequest.java             # NOVO — referencia com Bean Validation
│           └── PontoResponse.java            # + referencia, + localNome
└── resources/db/migration/
    └── V7__referencia_ponto.sql              # NOVO — expand, nullable com CHECK de tamanho

api/src/test/java/br/com/maissustentavel/api/
├── ponto/{PontoRepositoryTest,PontoServiceTest,PontoControllerTest}.java   # reescritos (Red)
├── ponto/PontoFixture.java                                                # NOVO — fixture compartilhada
├── coleta/{ColetaRepositoryTest,ColetaServiceTest,ColetaControllerTest}.java   # fixtures de Ponto
└── impacto/{ImpactoRepositoryTest,ImpactoServiceTest,ImpactoControllerTest}.java

frontend/src/app/
├── domain/ponto/
│   ├── apis/ponto.api.ts                     # listar global, criar com corpo, editar
│   ├── interfaces/ponto.interface.ts         # + referencia, + localNome, + PontoNaLista
│   ├── pages/pontos/                         # REESCRITA — visão geral cartões/tabela
│   ├── components/ponto-form/                # + autocomplete de local, + referencia
│   ├── components/ponto-detalhe/             # NOVO — ficha da estação
│   └── ponto.routes.ts                       # passa a montar em /pontos
├── domain/local/
│   ├── components/local-autocomplete/        # NOVO — busca com criação empilhada
│   ├── components/local-form/                # + aviso de pendências (US6)
│   └── pages/locais/                         # "Ver pontos" passa a levar a /pontos
├── domain/coleta/
│   ├── apis/coleta.api.ts                    # listar coletas de um ponto (se ainda não expõe)
│   └── interfaces/coleta.interface.ts        # coletorNome opcional
├── widget/components/form-drawer/            # + input de pendência no rodapé
└── app.routes.ts                             # + /pontos, − locais/:localId/pontos
```

**Structure Decision**: nada de novo estruturalmente — a feature ocupa as camadas que o refactor de
arquitetura estabeleceu. O backend segue pacote por domínio. No frontend, o **autocomplete de Local
vive em `domain/local/components/`**, não em `widget/`: ele conhece o domínio Local, busca locais e
abre o formulário de Local. O que é genérico (o painel) já está em `widget/`; o que sabe o que é um
local pertence ao domínio dele — é o que permite a tela de Coletas reaproveitar o mesmo autocomplete
sem herdar nada de Ponto.

Cinco observações sobre o alcance real:

- **A página `domain/ponto/pages/pontos/` é reescrita, não criada.** Ela existe hoje montada em
  `locais/:localId/pontos`. A rota muda para `/pontos` e o conteúdo é substituído. Nenhum recurso da
  tela antiga se perde — o destino de cada um está tabelado em `research.md` D8.
- **`domain/ponto/components/ponto-form/` já existe** e foi construído nesta mesma linha de trabalho:
  hoje só confirma e mostra o QR. Ganha o autocomplete de local e o campo de referência. Não é
  reescrito.
- **O `form-drawer` recebe uma quinta mudança** (`pendencia`), depois de `closable`, rodapé projetado e
  `nivel`. É sinal de que o componente está no lugar certo: cada tela nova pede uma capacidade e
  nenhuma pede um fork.
- **A US5 é a primeira validação real de painel sobre painel com escrita**, e não apenas leitura: o
  local criado tem de voltar selecionado no campo. O recuo por nível já está implementado.
- **`domain/coleta/apis/` pode já existir.** A tela de coletas de um ponto existe, então a camada de
  acesso provavelmente está pronta; a tarefa é conferir e reaproveitar, não recriar.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Coluna `referencia` **nullable** no banco, com obrigatoriedade só na aplicação — o banco deixa de ser segunda linha de defesa (tensiona Art. 7.6) | `NOT NULL` exigiria inventar uma referência para cada estação já cadastrada. "portaria", "estação 1" ou string vazia são dado falso que aparece como título de cartão e vaza para o adesivo impresso. A ausência é informação verdadeira, e a tela a trata exibindo a referência curta | `NOT NULL` com sentinela: mente sobre o dado, e a mentira fica no título da tela. `NOT NULL` com a migração falhando se houver linhas: inviabiliza `mvn verify` em base com dados. Apagar as estações sem referência: destrói QR já impresso e coletas já registradas. O endurecimento fica como migração futura, registrada em `research.md` D1 |
| Mudança **incompatível** no cadastro de Ponto — `POST /api/locais/{localId}/pontos` passa a exigir corpo | A referência é obrigatória em cadastros novos (FR-011) e não há de onde derivá-la. Aceitar cadastro sem corpo manteria uma porta que cria estação anônima, exatamente o que a feature existe para eliminar | Corpo opcional: deixaria a obrigatoriedade só na tela, e FR-018 exige o servidor. Endpoint paralelo versionado: o único consumidor é o frontend deste repositório, publicado no mesmo merge — versionar seria cerimônia sem consumidor, como já decidido na 006 |
