# Implementation Plan: Cálculo do valor social (IS-01)

**Branch**: `005-valor-social` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-valor-social/spec.md`

## Summary

Expor o **valor social** (R$ 1,00 × litros reais — RN-G-02) como agregado **somente-leitura** sobre as `Coleta` já registradas (OP-03), em três recortes: **total geral**, **por local** e **temporal** (filtro por intervalo de datas + série mensal). Sem entidade/persistência nova: são consultas de agregação (`sum`/`group by`) sobre `Coleta → Ponto → Local`, encapsuladas num módulo `impacto` (controller → service → repository), protegidas por sessão autenticada. A apresentação (painel) fica para a IS-02.

## Technical Context

**Language/Version**: Java 21 (somente no Docker — Art. 1.6).

**Primary Dependencies**: Spring Boot 4.1.0, Spring Data JPA / Hibernate 7, Spring Security 7.1.0, Flyway, Bean Validation.

**Storage**: PostgreSQL (Supabase em homolog/prod; `docker-compose` no dev). Origem: tabela `coleta` (já com RLS). **Sem nova tabela/migração.**

**Testing**: JUnit 5 + Spring Boot Test + **Testcontainers (PostgreSQL)**, rodando dentro do Docker (`mvn -B clean verify`). Classes de teste com `@Transactional` (isolamento — lição da OP-03).

**Target Platform**: API containerizada (Render); consumida pela SPA (fora de escopo aqui).

**Project Type**: Web (api + frontend) — **esta feature é backend puro**; nenhum arquivo em `frontend/`.

**Performance Goals**: MVP, volume baixo (dezenas/centenas de coletas). Agregação em uma consulta por recorte; sem N+1 (evitar carregar entidades — usar projeções).

**Constraints**: Precisão monetária com `BigDecimal` (litros 3 casas, valor social 2 casas, `HALF_UP`); consultas parametrizadas (Art. 7.6); mensagens de erro genéricas em pt-BR.

**Scale/Scope**: 3 endpoints de leitura sob `/api/impacto`, 1 service, 1 repositório de agregação (+ projeções), DTOs e 1 handler de exceção. Sem UI.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Art. 1 (Arquitetura em camadas)**: ✅ `ImpactoController → ImpactoService → ImpactoRepository → domínio (Coleta)`. Regra (conversão/validação de período) no service, não no controller.
- **Art. 2.1/2.2 (Domínio)**: ✅ Usa o trilho de **litros reais**; valor social = R$ 1,00 × litros reais, nunca declarado.
- **Art. 2.6 (Soft delete preserva valor social)**: ✅ A agregação **não** filtra por `arquivado` de local/ponto — coletas de entidades arquivadas continuam somando.
- **Art. 3 (SDD)**: ✅ Spec → Plan → Tasks → Analyze → Implement; Gherkin como fonte dos testes.
- **Art. 5 (TDD inegociável)**: ✅ Tarefas de teste antecedem implementação; Red→Green→Refactor; testes no Docker.
- **Art. 6 (Branches)**: ✅ `005-valor-social` criada de `develop`; promoção em lote ao fim da Sprint 3.
- **Art. 7 (Segurança)**: ✅ `/api/impacto/**` cai em `.anyRequest().authenticated()` → 401 sem sessão; GET (sem escrita) ⇒ sem novo vetor CSRF; CORS restrito reaproveitado; RLS já na `coleta`; validação de entrada (datas, `de ≤ ate`); consultas parametrizadas.
- **Art. 8 (Idioma)**: ✅ Tudo em pt-BR.

**Resultado**: PASS — sem violações. Seção *Complexity Tracking* não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/005-valor-social/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas (agregação, série mensal, filtro, precisão)
├── data-model.md        # Fase 1 — read-model (projeções), sem entidade nova
├── quickstart.md        # Fase 1 — validação ao vivo por API
├── contracts/
│   └── impacto.md        # Fase 1 — contrato dos 3 endpoints
├── checklists/
│   └── requirements.md   # qualidade da spec (já criado)
└── tasks.md             # Fase 2 — /speckit-tasks (não criado aqui)
```

### Source Code (repository root)

```text
api/src/main/java/br/com/maissustentavel/api/impacto/
├── web/
│   ├── ImpactoController.java          # GET /api/impacto/valor-social[/por-local|/mensal]
│   ├── ImpactoExceptionHandler.java    # PeriodoInvalido → 400; data em formato inválido → 400
│   └── dto/
│       ├── ValorSocialResponse.java        # { litrosReais, valorSocial }
│       ├── ValorSocialLocalResponse.java   # { localId, localNome, litrosReais, valorSocial }
│       └── ValorSocialMensalResponse.java  # { competencia:"YYYY-MM", litrosReais, valorSocial }
├── service/
│   ├── ImpactoService.java             # calcula/valida período; converte litros→R$
│   └── PeriodoInvalidoException.java    # de > ate
└── repository/
    ├── ImpactoRepository.java          # agregações JPQL (total, por local, mensal) c/ filtro de data
    └── (projeções: LocalAgregado, MensalAgregado)   # interfaces de projeção

api/src/test/java/br/com/maissustentavel/api/impacto/
├── ImpactoRepositoryTest.java          # soma/agrupamentos/filtro (Testcontainers, @Transactional)
├── ImpactoServiceTest.java             # conversão R$, reconciliação, período inválido, estado vazio
└── ImpactoControllerTest.java          # 200 (shapes + filtro + mensal), 400 (range/format), 401
```

**Structure Decision**: Módulo próprio `impacto` (espelha o padrão dos módulos `local`, `ponto`, `coleta`), mantendo a fronteira do agregado. As consultas de agregação ficam num `ImpactoRepository` dedicado (não poluem o `ColetaRepository`), lendo de `Coleta` via `join` para `Ponto`/`Local`. Nenhuma mudança em `frontend/` (backend puro).

## Complexity Tracking

> Sem violações da Constituição — seção não aplicável.
