# Fase 1 — Modelo de dados: Referência da estação

Decisões técnicas em [research.md](research.md). Contrato da API em [contracts/pontos.md](contracts/pontos.md).

---

## Tabela `ponto`

### Antes (V3)

| Coluna | Tipo | Restrição |
|---|---|---|
| `id` | uuid | PK, atribuída pela aplicação |
| `local_id` | uuid | FK → `local`, NOT NULL |
| `qr_conteudo` | text | NOT NULL, UNIQUE |
| `arquivado` | boolean | NOT NULL, default false |
| `criado_em` | timestamptz | NOT NULL, gerado no INSERT |

### Depois (V7)

Uma coluna acrescentada. Nada removido, nada renomeado — diferente da V6, aqui não há campo antigo para
arquivar.

| Coluna | Tipo | Restrição | Observação |
|---|---|---|---|
| `referencia` | text | **NULL permitido**, `char_length <= 60` por CHECK | Onde a estação fica dentro do local |

```sql
alter table ponto add column referencia text;

alter table ponto
    add constraint ponto_referencia_tamanho_check
        check (referencia is null or char_length(referencia) <= 60);
```

**Por que nullable**: as estações já cadastradas não têm referência e não existe valor verdadeiro para
preencher. A referência é o **título do cartão e do painel** — um sentinela apareceria como o nome da
coisa em toda a interface e no adesivo impresso. Ver [research.md](research.md) D1 e o Complexity
Tracking do plano.

**Por que CHECK e não `varchar(60)`**: é o padrão que a V6 usou para a lista fechada de UF, todas as
colunas de texto do schema são `text`, e evita divergência entre `@Column(length)` e a coluna real sob
`ddl-auto: validate`.

**Não há endurecimento nesta feature.** `NOT NULL` é migração futura, depois que os cadastros legados
forem completados. A V7 termina com a consulta que lista o que falta:

```sql
select id, local_id from ponto where referencia is null;
```

**RLS**: mantida como está. A V7 não toca em política de acesso.

---

## Entidade `Ponto`

Um campo novo. O resto permanece.

| Campo | Tipo Java | Mapeamento | Observação |
|---|---|---|---|
| `referencia` | `String` | `@Column(name = "referencia")` | Sem `nullable = false`: a coluna aceita nulo para o acervo antigo. A obrigatoriedade vive no DTO |

**Sem `length` no `@Column`**: o limite é do banco, por CHECK, e do DTO, por `@Size`. Declarar `length`
aqui faria o `ddl-auto: validate` comparar com uma coluna `text` sem tamanho declarado.

**Sem alteração no vínculo com Local.** `local` continua `@ManyToOne(optional = false)`. A edição não
aceita troca de local — RN-G-05 e [research.md](research.md) D3.

---

## DTOs

### `PontoRequest` (novo)

Usado no cadastro e na edição. É a **representação editável** de uma estação — e a estação só tem um
campo editável.

| Campo | Validação | Mensagem |
|---|---|---|
| `referencia` | `@NotBlank`, `@Size(max = 60)` | "não pode ser vazio" / limite de tamanho |

**O `localId` não está aqui.** No cadastro ele vem do caminho (`/api/locais/{localId}/pontos`); na
edição não é aceito de forma alguma, porque mover a estação de local reescreveria o histórico de dois
locais, inclusive valor social já publicado (RN-G-05).

**Normalização antes da persistência**, no `PontoService`: `trim` na referência (FR-016). String só com
espaços é **recusada** pela validação, não convertida em `null` — sem isso, um cadastro novo com `"   "`
viraria um nulo legítimo e furaria a obrigatoriedade por dentro, já que a coluna aceita nulo.

### `PontoResponse` (dois campos novos)

| Campo | Tipo | Novo? | Observação |
|---|---|---|---|
| `id` | `UUID` | | |
| `localId` | `UUID` | | |
| `localNome` | `String` | **sim** | Compõe a identificação "Local · referência" (FR-003) |
| `referencia` | `String` | **sim** | `null` para estações do acervo antigo |
| `qrConteudo` | `String` | | Endereço público completo — é o que a ação de copiar entrega (FR-031) |
| `qrImagemUrl` | `String` | | Aponta para `GET /api/pontos/{id}/qr` |
| `arquivado` | `boolean` | | |
| `criadoEm` | `OffsetDateTime` | | |

**Um DTO só para as duas coleções.** A global e a aninhada no Local compartilham `PontoResponse`; a
ficha do Local, que já consome a aninhada, ganha a referência sem mudança de contrato do lado dela.

**`localNome` exige carregar o Local.** A associação é `LAZY`; a consulta da listagem usa `join fetch`
para não disparar uma consulta por linha ao ler o nome.

---

## Interfaces do frontend

### `Ponto` (dois campos novos)

```text
id            string
localId       string
localNome     string
referencia    string | null      ← null no acervo antigo
qrConteudo    string
qrImagemUrl   string
arquivado     boolean
criadoEm      string
```

### `PontoNaLista` (derivada, só na tela)

O mesmo que a 006 fez com `LocalNaLista`: os campos que o filtro de coluna precisa encontrar como
propriedade, porque o filtro da tabela casa por nome de campo e não sabe ler expressão.

```text
...Ponto
situacao      'ATIVO' | 'ARQUIVADO'    ← derivado de arquivado, para o filtro de coluna
titulo        string                   ← referencia, ou a referência curta quando ausente
refCurta      string                   ← primeiros 8 caracteres do id
```

**`titulo` é derivado e não vem do servidor.** A regra de reserva (FR-013) é de apresentação: o servidor
diz a verdade — `referencia: null` — e a tela decide o que mostrar no lugar. Se o servidor mandasse a
referência curta preenchida, ninguém saberia mais quais estações ainda precisam ser nomeadas, e a
consulta da fila de trabalho da V7 deixaria de bater com a tela.

### `IndicadoresDaEstacao` (montada da resposta de coletas)

A consulta de coletas já devolve `ColetasDoPonto { totalLitros, coletas }`, com o total somado no
servidor. Só a média é derivada no cliente ([research.md](research.md) D5).

```text
litros        number          totalLitros, direto da resposta — NÃO somado no cliente
valorSocial   number          totalLitros × 1 (RN-G-02)
media         number | null   totalLitros ÷ coletas.length; null quando não há coleta
```

**`media` é `null`, não `0`, sem coletas** (FR-034). Zero afirmaria que as coletas vieram vazias. É a
mesma distinção que a 006 fez entre "não recolheu" e "não conseguimos consultar".

---

## Entidades já existentes, não alteradas

- **`Local`**: nenhuma mudança de modelo. Passa a ser lido pela busca do autocomplete (locais ativos) e
  criado a partir do painel empilhado, pelo formulário que já existe.
- **`Coleta`**: nenhuma mudança. `ColetaResponse` já expõe `coletorNome`, que pode ser nulo — é o dado
  que o histórico da ficha exibe (FR-035, FR-036). Nada a acrescentar: a informação existe desde a
  OP-03 e nunca foi mostrada.

---

## Migração e ordem

1. **V7** acrescenta a coluna e o CHECK. Roda em base vazia e em base com dados sem tratamento
   especial — não há `update` de preservação, porque não existe campo antigo de onde copiar.
2. **Entidade** ganha o campo; `ddl-auto: validate` confirma que schema e mapeamento concordam.
3. **DTOs e serviço**: cadastro passa a exigir corpo, edição aparece, resposta cresce dois campos.
4. **Testes de Ponto, Coleta e Impacto** são reescritos para a fixture compartilhada
   ([research.md](research.md) D10).
5. **Frontend** consome o contrato novo.

A ordem importa: o passo 3 é mudança incompatível, então frontend e backend precisam ser publicados no
mesmo merge — o que já é o caso, por serem o mesmo repositório.
