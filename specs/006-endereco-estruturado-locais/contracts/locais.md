# Contrato — Local com endereço estruturado (`/api/locais`)

**Feature**: `006-endereco-estruturado-locais` · **Data**: 2026-07-31

Revisa o contrato de [`002-cadastro-locais/contracts/locais.md`](../../002-cadastro-locais/contracts/locais.md). **Os endpoints, códigos de status e a semântica de cada operação não mudam** — muda apenas a representação do endereço no corpo.

Autenticação, CSRF e formatos de erro seguem exatamente como na CA-01: sessão por cookie `HttpOnly` (sem sessão → **401**), escritas exigem `X-XSRF-TOKEN` (sem token → **403**), corpo e mensagens em pt-BR, `Content-Type: application/json`.

---

## Mudança de representação

### Antes (CA-01)

```json
{ "endereco": "Rua das Flores, 100 - Centro" }
```

### Depois (esta feature)

```json
{
  "cep": "38408100",
  "rua": "Avenida João Naves de Ávila",
  "numero": "1841",
  "complemento": "Bloco B, sala 2",
  "bairro": "Saraiva",
  "cidade": "Uberlândia",
  "uf": "MG"
}
```

O campo `endereco` **deixa de existir** na requisição e na resposta. É mudança incompatível, aceitável porque o único consumidor da API é o frontend deste repositório, versionado junto.

> `cep` trafega com **oito dígitos, sem formatação** (D10). A máscara `99999-999` é da interface.
> `uf` é o **código** de duas letras. Para UF, código e rótulo coincidem.
> `complemento` é o **único** campo opcional do endereço — pode vir ausente, `null` ou vazio.

---

## Representações

`LocalResponse`:

```json
{
  "id": "uuid",
  "nome": "EMEF Professora Zaida Barbosa",
  "tipo": "ESCOLA",
  "cep": "38408100",
  "rua": "Avenida João Naves de Ávila",
  "numero": "1841",
  "complemento": null,
  "bairro": "Saraiva",
  "cidade": "Uberlândia",
  "uf": "MG",
  "arquivado": false,
  "criadoEm": "2026-07-31T12:00:00Z"
}
```

> Locais migrados do modelo antigo (D1) respondem com `cep`, `numero`, `bairro`, `cidade` e `uf` **nulos** e `rua` preenchida com o texto livre original. A interface os apresenta como endereço incompleto, e a edição exige completar todos os obrigatórios antes de salvar.

`LocalRequest` (criação e edição):

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `nome` | string | sim | não vazio |
| `tipo` | enum | sim | `CONDOMINIO` · `ESCOLA` · `EMPRESA` · `ESPACO_PUBLICO` · `OUTRO` |
| `cep` | string | sim | exatamente 8 dígitos |
| `rua` | string | sim | não vazio |
| `numero` | string | sim | não vazio; texto (aceita `s/n`, `120A`) |
| `complemento` | string | **não** | — |
| `bairro` | string | sim | não vazio |
| `cidade` | string | sim | não vazio |
| `uf` | enum | sim | uma das 27 siglas |

Campos preenchidos apenas com espaços contam como vazios.

---

## Endpoints — inalterados

| Método | Caminho | Sucesso | Erros |
|---|---|---|---|
| `POST` | `/api/locais` | **201** + `LocalResponse`, header `Location` | 400 validação · 401 |
| `GET` | `/api/locais?arquivados=` | **200** + `LocalResponse[]` | 401 |
| `GET` | `/api/locais/{id}` | **200** + `LocalResponse` | 404 · 401 |
| `PUT` | `/api/locais/{id}` | **200** + `LocalResponse` | 400 validação · 404 · 401 |
| `POST` | `/api/locais/{id}/arquivar` | **200** + `arquivado=true`, idempotente | 404 · 401 |
| `POST` | `/api/locais/{id}/reativar` | **200** + `arquivado=false`, idempotente | 404 · 401 |

`GET /api/locais` mantém o parâmetro `arquivados` (default `false`) devolvendo **um** dos conjuntos. O frontend chama duas vezes em paralelo para montar a lista completa (D7) — o contrato não ganha valor "todos".

---

## Erros de validação

O formato da CA-01 permanece: mapa campo → mensagem.

```json
{
  "erro": "Dados inválidos",
  "campos": {
    "cep": "deve ter 8 dígitos",
    "bairro": "não pode ser vazio",
    "uf": "valor inválido"
  }
}
```

Nenhum corpo de erro expõe stacktrace, SQL ou detalhe interno (FR-030 / Art. 7.6).

---

## Dependência externa consumida pelo frontend

O ViaCEP é chamado **pelo navegador**, não pela API (D3) — não faz parte deste contrato e não há endpoint de CEP nesta API. Registrado aqui apenas para deixar claro o limite: a API nunca consulta serviço de endereçamento, e por isso um ViaCEP fora do ar não afeta nenhum endpoint documentado acima.

---

## Reutilizado sem alteração

`GET /api/impacto/valor-social/por-local`, entregue na IS-01, alimenta a coluna Litros. Contrato em [`005-valor-social/contracts/impacto.md`](../../005-valor-social/contracts/impacto.md). Esta feature apenas o consome — nada nele muda.

---

## A ficha do local (US5) não muda o contrato

A ficha somente leitura de um Local é composta inteiramente de endpoints **que já existem**:

| O que a ficha mostra | De onde vem |
|---|---|
| Nome, tipo, situação e endereço completo | `GET /api/locais/{id}` (ou o `LocalResponse` já carregado na lista) |
| Lista e quantidade de pontos de coleta | `GET /api/locais/{id}/pontos` (CA-02) |
| Litros acumulados e valor social | `GET /api/impacto/valor-social/por-local` (IS-01), o mesmo agregado já consultado para a coluna Litros — a ficha reaproveita o resultado, sem chamada nova |

Nenhum endpoint novo, nenhum campo novo, nenhuma mudança de status. Se algum dia a ficha precisar de um endpoint próprio, será por decisão de desempenho, não por falta de dado.

> **O agregado por ponto não existe.** O desenho de referência exibia, em cada ponto, litros e data da última coleta ("614 L · coleta 11/07"). Não há endpoint que devolva isso por ponto, e derivá-lo hoje custaria uma requisição por ponto (N+1). O dado pertence à história **VH-02** ("ver o volume por ponto") e o endpoint correspondente será definido no contrato dela. Até então, a ficha lista os pontos sem métrica própria.
