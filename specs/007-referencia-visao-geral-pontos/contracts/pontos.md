# Fase 1 — Contrato de Ponto de coleta (revisão da 007)

Todas as rotas exigem sessão autenticada de Gestor. Escritas exigem token CSRF, como o resto da API.

**Resumo da mudança**: uma operação nova (`GET /api/pontos`), uma operação nova de escrita
(`PUT /api/pontos/{id}`), uma **mudança incompatível** (`POST` de cadastro passa a exigir corpo) e dois
campos novos na representação. Nada é removido.

---

## Representação de Ponto

```json
{
  "id": "96e96ba8-2c41-4f0e-9d33-77b1f0c9a512",
  "localId": "b4a1c8d2-1111-2222-3333-444455556666",
  "localNome": "EMEF Professora Zaida Barbosa",
  "referencia": "pátio",
  "qrConteudo": "https://sustentavel.app/p/96e96ba8-2c41-4f0e-9d33-77b1f0c9a512",
  "qrImagemUrl": "/api/pontos/96e96ba8-2c41-4f0e-9d33-77b1f0c9a512/qr",
  "arquivado": false,
  "criadoEm": "2026-07-30T12:00:00Z"
}
```

**Campos novos**: `localNome` e `referencia`.

**`referencia` pode ser `null`** — estações cadastradas antes desta feature não têm. Não é erro nem
dado faltando por falha: é a verdade sobre o acervo, e quem consome decide o que exibir no lugar
(FR-013). O servidor não substitui por referência curta.

**`qrConteudo` é o endereço público completo**, com o identificador inteiro. Quem exibe pode abreviar;
quem copia tem de entregar este valor (FR-031).

---

## `GET /api/pontos` — coleção global (nova)

Lista estações de **todos** os locais. É a operação que a visão geral precisa e que não existia.

**Parâmetros**

| Nome | Tipo | Padrão | Descrição |
|---|---|---|---|
| `arquivados` | boolean | `false` | `false` devolve ativas; `true` devolve arquivadas |

**Resposta** `200` — array de Ponto, ordenado por `localNome` e, dentro do local, por `referencia`.
Estações sem referência vêm ao final do grupo do seu local.

```http
GET /api/pontos
GET /api/pontos?arquivados=true
```

**Sem paginação.** A operação tem dezenas de estações e a filtragem acontece no cliente, como em
Locais. Se a escala mudar, paginação entra sem quebrar este contrato.

**A ordenação é do servidor** porque é ordenação de domínio — agrupar estações do mesmo local —, não
preferência de apresentação. Deixá-la no cliente obrigaria a repeti-la nos dois modos de visualização.

---

## `GET /api/locais/{localId}/pontos` — coleção aninhada (mantida)

Inalterada em forma; a representação ganha `referencia` e `localNome` como todas as outras.

**Permanece por uso real**: a ficha do Local, entregue na 006, lista os pontos daquele local por aqui.
Não é código morto.

| Parâmetro | Tipo | Padrão |
|---|---|---|
| `arquivados` | boolean | `false` |

**Resposta** `200` — array de Ponto. `404` se o local não existir.

---

## `POST /api/locais/{localId}/pontos` — cadastro (**mudança incompatível**)

Passa a exigir corpo. Antes não recebia nenhum.

**Corpo**

```json
{ "referencia": "pátio" }
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `referencia` | **sim** | Não vazio; no máximo 60 caracteres; espaços nas pontas descartados |

**Resposta** `201` com a estação criada, incluindo `qrConteudo` e `qrImagemUrl` já disponíveis.

**Erros**

| Situação | Status | Corpo |
|---|---|---|
| **Corpo ausente** | `400` | `{"erro": "Dados inválidos"}` — **sem** o mapa `campos` |
| Referência vazia (`""`) ou só espaços (`"   "`) | `400` | `{"campos": {"referencia": "não pode ser vazio"}}` |
| Referência acima de 60 caracteres | `400` | `{"campos": {"referencia": "deve ter no máximo 60 caracteres"}}` |
| Local inexistente | `404` | erro sem detalhe interno |
| Local arquivado | `409` | comportamento já existente, preservado |

> **Corpo ausente não produz o mapa `campos`**, e a primeira versão desta tabela dizia que produzia. A
> requisição sem corpo falha na **desserialização** (`HttpMessageNotReadableException`), antes de o Bean
> Validation existir para reclamar de campo — então não há campo a nomear. É a mesma assimetria que a
> 006 registrou para UF inválida, que falha na desserialização do enum. Corrigido depois que a
> implementação mostrou o comportamento real.

**Por que exigir corpo em vez de aceitá-lo opcional**: FR-011 torna a referência obrigatória em
cadastros novos e FR-018 exige que a regra valha no servidor. Corpo opcional deixaria aberta uma porta
que cria estação anônima — exatamente o que a feature existe para eliminar. Registrado em Complexity
Tracking do plano.

**Espaços em branco não viram nulo.** `"   "` é **recusado**, não normalizado para `null`. A coluna
aceita nulo para o acervo antigo; converter em nulo furaria a obrigatoriedade por dentro.

---

## `PUT /api/pontos/{id}` — edição da referência (nova)

**Corpo**: mesmo `PontoRequest` do cadastro.

```json
{ "referencia": "pátio coberto" }
```

**Resposta** `200` com a estação atualizada.

**Erros**: mesmos `400` do cadastro; `404` se a estação não existir.

**O local não é aceito no corpo e não pode mudar.** Não é limitação de escopo: a RN-G-05 diz que o ponto
permanece vinculado ao local, e o QR já impresso e colado aponta para uma estação que o morador associa
àquele endereço. Mover a estação reescreveria o histórico de coletas de dois locais, incluindo valor
social já publicado. Quem errou o local cadastra outra estação e arquiva a errada — os dois históricos
ficam corretos.

**Estação arquivada pode ter a referência corrigida.** Arquivar preserva histórico (RN-G-06), e corrigir
o rótulo de um registro histórico não o reativa.

---

## Inalterados

| Operação | Observação |
|---|---|
| `GET /api/pontos/{id}/qr` | PNG do QR. Mesma origem, então o cookie de sessão acompanha a requisição da imagem |
| `POST /api/pontos/{id}/arquivar` | Soft delete (RN-G-06) |
| `POST /api/pontos/{id}/reativar` | |
| `GET /api/pontos/{pontoId}/coletas` | **É a única consulta que a ficha faz.** Alimenta o histórico e, dele, os três indicadores. `ColetaResponse.coletorNome` pode ser `null` |
| `POST /api/pontos/{pontoId}/coletas` | A ficha leva até a tela de coletas; o formulário não é reimplementado |

---

## Não faz parte deste contrato

| Operação | Por quê |
|---|---|
| `GET /api/pontos/{id}` | A ficha é alimentada pela linha que a abriu, como a ficha do Local. Um detalhe repetiria dado que já está na mão ([research.md](research.md) D13) |
| `GET /api/impacto/valor-social/por-ponto` | Recorte de escopo do Gestor. É o que permitiria mostrar volume nos cartões; a ficha deriva os números do histórico. Próximo passo natural quando VH-02 for entregue por inteiro |
| Endpoint de busca de locais | O autocomplete filtra no cliente sobre os locais ativos já carregados ([research.md](research.md) D7) |
| Folha de adesivos com vários QR | Fora de escopo |
| Remoção física de estação | Só soft delete (RN-G-06) |
