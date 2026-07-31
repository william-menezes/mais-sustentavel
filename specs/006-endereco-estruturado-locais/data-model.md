# Modelo de dados — Endereço estruturado de Local

**Feature**: `006-endereco-estruturado-locais` · **Data**: 2026-07-31

Alteração sobre o modelo entregue na CA-01 (`002-cadastro-locais`). Decisões de fundo em [research.md](research.md) — D1 (migração), D2 (UF), D10 (formato do CEP).

---

## Tabela `local` — depois da V6

| Coluna | Tipo | Nulo | Observações |
|---|---|---|---|
| `id` | uuid | não | PK, `gen_random_uuid()` — inalterada |
| `nome` | text | não | inalterada |
| `tipo` | text | não | enum `TipoLocal` como string — inalterada |
| `cep` | text | **sim** | oito dígitos, sem formatação (D10). Obrigatório na API |
| `rua` | text | **sim** | logradouro. Obrigatório na API |
| `numero` | text | **sim** | texto, admite `s/n` e `120A` (FR-006). Obrigatório na API |
| `complemento` | text | sim | **opcional também na API** (FR-002) |
| `bairro` | text | **sim** | Obrigatório na API |
| `cidade` | text | **sim** | Obrigatório na API |
| `uf` | text | **sim** | enum `Uf` como string, duas letras (D2). Obrigatório na API |
| `endereco_legado` | text | sim | ex-`endereco`, preservado (FR-008). Nunca escrito por código novo |
| `arquivado` | boolean | não | inalterada |
| `criado_em` | timestamptz | não | inalterada |

RLS permanece habilitada, como nas migrações anteriores.

> **As colunas de endereço são nullable no banco de propósito.** A obrigatoriedade é validada no servidor (FR-009). A justificativa completa está em D1: `NOT NULL` exigiria inventar CEP, número, bairro, cidade e UF para os registros legados. O endurecimento é dívida registrada, não esquecimento.

### Migração V6 — passos

1. Adicionar as sete colunas novas, todas nullable.
2. `rua = endereco` para toda linha existente — o texto livre é predominantemente logradouro.
3. Renomear `endereco` para `endereco_legado`, tornando-a nullable.

Sem `NOT NULL`, sem `CHECK` e sem sentinela, a migração é idempotente em base vazia (produção) e determinística em base com dados (desenvolvimento).

### Identificando os registros a completar

```sql
select id, nome, endereco_legado
from local
where endereco_legado is not null and cep is null;
```

Fila de trabalho do Gestor: locais que vieram do modelo antigo e ainda não têm endereço estruturado.

---

## Domínio Java

### `Local` (entidade)

Ganha `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade` e `uf` (tipo `Uf`, `@Enumerated(STRING)`). Perde o campo `endereco`.

`endereco_legado` **não é mapeado na entidade**: é coluna de arquivo histórico, não atributo de negócio. Mapeá-la convidaria código novo a escrever nela. Consultas de auditoria usam SQL direto.

> Atenção ao `ddl-auto: validate`: mapear um campo inexistente no banco, ou deixar de mapear um `NOT NULL`, derruba o start da aplicação. Como todas as colunas novas são nullable, o mapeamento é compatível.

### `Uf` (enum, novo)

As 27 unidades federativas: `AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO`.

Segue a forma de `TipoLocal`: enum no domínio, persistido como string, com o rótulo em pt-BR derivado no frontend. Para UF sigla e rótulo coincidem, então não há tabela de rótulos.

### Validação nos DTOs (`LocalRequest`)

| Campo | Restrições |
|---|---|
| `nome` | `@NotBlank` |
| `tipo` | `@NotNull` (enum) |
| `cep` | `@NotBlank`, `@Pattern("\\d{8}")` (FR-003, D10) |
| `rua` | `@NotBlank` |
| `numero` | `@NotBlank` |
| `complemento` | sem restrição — opcional |
| `bairro` | `@NotBlank` |
| `cidade` | `@NotBlank` |
| `uf` | `@NotNull` (enum) |

`@NotBlank` cobre o caso de borda "apenas espaços em branco" do spec. Valor de enum fora da lista falha na desserialização e cai no mesmo 400 de validação, como já ocorre hoje com `tipo`.

---

## Frontend — interfaces

`domain/local/interfaces/local.interface.ts` passa a expor os componentes separados no lugar de `endereco`, mantendo o nome dos tipos (`Local`, `LocalRequest`, `TipoLocal`) e ganhando `Uf`.

```
Local        : id, nome, tipo, cep, rua, numero, complemento?, bairro, cidade, uf, arquivado, criadoEm
LocalRequest : nome, tipo | null, cep, rua, numero, complemento, bairro, cidade, uf | null
```

`domain/local/constants/uf.constant.ts` traz `UFS` no mesmo formato de `TIPOS_LOCAL` (`{ label, value }[]`), para alimentar o `p-select`.

### Derivados de exibição (não persistidos)

| Derivado | Origem | Uso |
|---|---|---|
| endereço resumido | `rua, numero — bairro` | subtítulo da coluna Local (FR-015) |
| situação | `arquivado ? 'ARQUIVADO' : 'ATIVO'` | coluna filtrável por lista fechada (FR-017) |
| litros | junção com `/api/impacto/valor-social/por-local` por `localId` | coluna Litros (D6) |

A **situação como valor discreto** é o que permite o filtro `equals` do menu de coluna operar sobre um booleano sem expor "true/false" ao Gestor.

---

## O que não muda

- Nome de Local continua **não único**; dois locais podem dividir o mesmo endereço (blocos distintos).
- `arquivado` continua booleano — nenhum estado intermediário (decisão do spec).
- Soft delete e a idempotência de arquivar/reativar seguem como na CA-01.
- Nenhuma relação nova: Ponto continua apontando para Local sem alteração.
