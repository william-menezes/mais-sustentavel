# Specification Quality Checklist: Referência da estação e visão geral de Pontos de coleta

**Purpose**: Validar completude e qualidade da especificação antes de seguir para o planejamento
**Created**: 2026-07-31
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

Nenhum `[NEEDS CLARIFICATION]` foi necessário: as quatro decisões que estavam abertas — obrigatoriedade
da referência e tratamento do acervo existente, aviso de pendências no rodapé, recorte de escopo da API
e destino da tela de estações por local — foram respondidas pelo Gestor do produto antes da redação.

### Correções aplicadas durante a validação

Três itens reprovaram na primeira passada e foram corrigidos:

1. **FR-017 não era testável.** Dizia apenas "limitar o tamanho da referência", sem número. Passou a
   fixar **60 caracteres**, com a justificativa do valor.
2. **FR-034 era ambíguo.** Dizia que a média "não deve ser apresentada" sem coletas, sem dizer o que
   aparece no lugar. Passou a exigir marca de ausência e a proibir explicitamente o zero, que
   afirmaria que as coletas vieram vazias.
3. **"Referência curta" não estava definida** e era usada em FR-013 e FR-029. Ganhou entrada própria em
   *Key Entities*.

### Exceção consciente ao critério "no implementation details"

**FR-018** ("a obrigatoriedade MUST ser garantida pelo servidor, não apenas pela tela") e a nota de
borda sobre "sem paginação no servidor" nomeiam uma fronteira de confiança, não uma escolha de
tecnologia. O Art. 7.6 da constituição exige validação em toda fronteira da API, então *onde* a regra é
garantida é requisito de segurança — e uma spec que só dissesse "o sistema exige a referência"
permitiria satisfazer o requisito apenas desabilitando um botão. Mesma decisão tomada na feature 006.

### Observações que não bloqueiam

- **FR-054** ("nenhuma superfície pública passa a expor dado que hoje não expõe") é um requisito de
  guarda, verificável por revisão e não por cenário. Mantido pelo mesmo motivo que na 006: sem ele
  escrito, ninguém confere.
- **SC-001** e **SC-002** comparam com o estado atual ("hoje isso é impossível", "sem abrir nenhuma das
  duas"). São verificáveis por observação direta, embora não tenham número.
