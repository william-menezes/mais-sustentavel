# Data Model — Cálculo do valor social (IS-01)

**Nenhuma entidade nova e nenhuma migração.** O valor social é um **read-model** (agregado calculado) sobre dados existentes. Esta feature apenas lê `Coleta` e o vínculo `Coleta → Ponto → Local`.

## Origem (já existente)

- **Coleta** (OP-03) — `litrosReais: numeric(12,3) (>0)`, `data: date`, `ponto_id → Ponto`. Imutável (append-only). Tabela com RLS.
- **Ponto** (CA-02) — `local_id → Local`, `arquivado: boolean`. *(O `arquivado` do ponto/local **não** filtra a agregação — RN-G-06.)*
- **Local** (CA-01) — `id`, `nome`, `arquivado: boolean`.

Relação usada na agregação: `Coleta` N:1 `Ponto` N:1 `Local`.

## Read-model (projeções calculadas)

Constante do domínio: **TAXA = R$ 1,00 / litro** (RN-G-02). Regra: `valorSocial = litrosReais × TAXA`, com `litrosReais` em 3 casas e `valorSocial` em 2 casas (`HALF_UP`).

### 1. Total geral — `ValorSocialResponse`
| Campo | Tipo | Origem/Regra |
|-------|------|--------------|
| `litrosReais` | BigDecimal (3 casas) | `coalesce(sum(Coleta.litrosReais), 0)` no período |
| `valorSocial` | BigDecimal (2 casas) | `litrosReais × 1,00` |

### 2. Por local — `ValorSocialLocalResponse[]`
| Campo | Tipo | Origem/Regra |
|-------|------|--------------|
| `localId` | UUID | `Local.id` |
| `localNome` | String | `Local.nome` |
| `litrosReais` | BigDecimal (3 casas) | soma das coletas dos pontos do local, no período |
| `valorSocial` | BigDecimal (2 casas) | `litrosReais × 1,00` |

Ordenado por `localNome`. Locais sem coletas (no período) não produzem linha.

### 3. Série mensal — `ValorSocialMensalResponse[]`
| Campo | Tipo | Origem/Regra |
|-------|------|--------------|
| `competencia` | String `"YYYY-MM"` | `year(Coleta.data)`+`month(Coleta.data)` formatados |
| `litrosReais` | BigDecimal (3 casas) | soma das coletas do mês, no período |
| `valorSocial` | BigDecimal (2 casas) | `litrosReais × 1,00` |

Ordenado cronologicamente (ano, mês). Meses sem coletas não produzem linha.

## Projeções internas (repository)

- **LocalAgregado** *(interface projection)*: `getLocalId(): UUID`, `getLocalNome(): String`, `getLitros(): BigDecimal`.
- **MensalAgregado** *(interface projection)*: `getAno(): int`, `getMes(): int`, `getLitros(): BigDecimal`.

O service converte essas projeções em DTOs de resposta (aplicando a TAXA e a escala monetária) e formata `competencia`.

## Parâmetros de período (entrada, transversal aos 3 recortes)

| Parâmetro | Tipo | Regra |
|-----------|------|-------|
| `de` | LocalDate (ISO, opcional) | inclui `Coleta.data >= de` |
| `ate` | LocalDate (ISO, opcional) | inclui `Coleta.data <= ate` |

Validação: formato ISO válido; se ambos presentes, `de ≤ ate` (senão **400**, sem cálculo). Ausência de um extremo ⇒ intervalo aberto naquele lado.

## Invariantes / regras refletidas

- **RN-G-02**: valor social sempre sobre litros reais; nunca sobre declarado (o declarado sequer existe no MVP).
- **RN-G-06**: coletas de local/ponto arquivado **contam** (agregação não filtra por `arquivado`).
- **Reconciliação**: `sum(valorSocial por local) == sum(valorSocial mensal) == valorSocial total`, para o mesmo período (SC-002).
- **Estado vazio**: sem coletas / período vazio ⇒ total `0` e listas vazias (sucesso, não erro).
