# Specification Quality Checklist: Endereço estruturado e visão geral de Locais

**Purpose**: Validar completude e qualidade da especificação antes de seguir para o planejamento
**Created**: 2026-07-31
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Sem detalhes de implementação (linguagens, frameworks, APIs)
- [x] Focado em valor para o usuário e necessidade de negócio
- [x] Escrito para leitores não técnicos
- [x] Todas as seções obrigatórias preenchidas

## Requirement Completeness

- [x] Nenhum marcador [NEEDS CLARIFICATION] restante
- [x] Requisitos testáveis e sem ambiguidade
- [x] Critérios de sucesso mensuráveis
- [x] Critérios de sucesso independentes de tecnologia
- [x] Todos os cenários de aceite definidos
- [x] Casos de borda identificados
- [x] Escopo claramente delimitado
- [x] Dependências e premissas identificadas

## Feature Readiness

- [x] Todos os requisitos funcionais têm critério de aceite claro
- [x] Os cenários cobrem os fluxos principais
- [x] A feature atende aos resultados mensuráveis definidos em Success Criteria
- [x] Nenhum detalhe de implementação vazou para a especificação

## Notes

Validado em uma iteração, sem `[NEEDS CLARIFICATION]`. Registros da revisão:

- **Vocabulário neutro conferido.** A especificação fala em "serviço público de endereçamento", "painel sobreposto" e "filtro com critérios de comparação" — sem nomear o provedor de CEP, o componente de painel ou a biblioteca de tabela. Essas escolhas pertencem ao plano.
- **FR-009 cita "servidor".** Mantido de propósito: não é detalhe de implementação, é fronteira de confiança — a validação não pode existir apenas na interface (Art. 7.6).
- **FR-030 e FR-031 não têm cenário Gherkin próprio.** São restrições transversais (não expor detalhe interno; não publicar endereço detalhado), verificáveis por inspeção e por teste de contrato, não por jornada do Gestor. Mesmo padrão adotado na `002-cadastro-locais` (FR-012, FR-013).
- **Tensão resolvida entre a decisão de produto e a RN-G-06.** A VH-01 exige "só ativos por padrão", enquanto o desenho de referência pede ativos e arquivados na mesma lista. Conciliado em FR-016 + FR-017: o conjunto carregado é completo, e o filtro de situação já chega definido em "ativo". Isso também explica a contagem "exibidos de total" (FR-018).
- **VH-01 entregue parcialmente**, e isso está declarado em Out of Scope: a contagem de pontos por local depende de agregado inexistente na API e ficou para história própria.
- **UF incorporada após revisão.** A primeira versão do spec registrava, como premissa, que a UF não seria capturada — por ausência no desenho de referência. O responsável do produto decidiu incluí-la, e ela entrou como componente obrigatório (FR-001, FR-002) com lista fechada própria (FR-004), no mesmo padrão do tipo de local. A premissa foi substituída por "endereçamento brasileiro apenas", e a UF saiu de Out of Scope.
