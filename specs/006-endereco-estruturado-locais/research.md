# Research — Endereço estruturado e visão geral de Locais

**Feature**: `006-endereco-estruturado-locais` · **Data**: 2026-07-31

Fase 0 do plano. Cada decisão resolve uma incógnita técnica do spec. Onde havia suposição verificável, ela foi **verificada empiricamente** e o resultado está registrado.

---

## D1 — Destino do `endereco` legado na migração V6

**Decisão**: padrão *expand / migrate / contract*, com apenas a fase **expand** nesta feature.

A V6 adiciona as sete colunas novas como **nullable**, preserva o texto livre atual renomeando `endereco` para `endereco_legado` (também nullable), e copia o conteúdo para `rua` — o componente que o texto livre mais frequentemente representa. A obrigatoriedade vive na **validação do servidor** (Bean Validation nos DTOs), não em `NOT NULL`. O endurecimento para `NOT NULL` fica registrado como migração futura, a ser feita depois que os cadastros legados forem completados pelo Gestor.

**Racional**: `NOT NULL` nas colunas novas exigiria preencher CEP, número, bairro, cidade e UF de registros que não têm esse dado. Qualquer valor inventado — `'00000000'`, `'A INFORMAR'`, uma UF chutada — é dado sujo que se propaga e, no caso da UF, quebraria a lista fechada. Preservar o texto original em `endereco_legado` satisfaz a FR-008 de forma **verificável**: nada é perdido e a origem continua consultável. Locais migrados ficam identificáveis (`endereco_legado IS NOT NULL AND cep IS NULL`), o que dá ao Gestor uma fila de trabalho concreta.

Vale registrar o contexto: **a tabela `local` em produção está vazia** (nenhum Local foi cadastrado, porque não havia conta de Gestor até esta semana). Em produção a migração é, na prática, apenas criação de colunas. A complexidade acima existe para o ambiente de desenvolvimento, que tem dados, e para que a migração seja determinística em qualquer base — como exige a FR-008.

**Alternativas rejeitadas**:
- *`NOT NULL` com sentinela* (`'A INFORMAR'`, `'00000000'`): schema mais forte, mas mente sobre o dado e conflita com a lista fechada de UF. Um relatório futuro por cidade contaria endereços inexistentes como reais.
- *`NOT NULL` com a migração falhando se houver linhas*: força limpeza manual antes de migrar. Inviável em desenvolvimento e transforma um `mvn verify` numa intervenção humana.
- *Descartar as linhas legadas*: viola FR-008 diretamente.
- *Manter `endereco` como coluna derivada, preenchida por trigger*: duplica a verdade em dois lugares e a mantém sincronizada por efeito colateral, contra o Art. 1.1 (lógica no serviço, não no banco).

---

## D2 — UF como lista fechada

**Decisão**: `enum Uf` no domínio Java com as 27 unidades federativas, persistido como texto via `@Enumerated(EnumType.STRING)`, **mais `CHECK` na coluna**. No frontend, `UFS` em `domain/local/constants/uf.constant.ts`.

**Racional**: espelha o tratamento que `TipoLocal` já recebe — e isso inclui o banco. A V3 define `local_tipo_check` restringindo o tipo à lista fechada, então o precedente do projeto é enum no domínio **somado** a `CHECK` no DDL, não apenas o enum.

> **Correção de rota.** A primeira versão desta decisão dizia "sem `CHECK`, espelhando `TipoLocal`" — afirmação factualmente errada, porque `TipoLocal` tem `CHECK` desde a V3. O erro só apareceu ao abrir a migração V3 durante a implementação. Como a coluna `uf` é nullable nesta fase (D1), o `CHECK` precisa admitir nulo: `check (uf is null or uf in (...))`.

**Alternativa rejeitada**: apenas o enum, sem `CHECK`. Menos DDL para manter, mas abriria exceção num padrão já estabelecido pela tabela — e a defesa em profundidade do Art. 7.6 favorece a restrição no banco.

---

## D3 — Consulta de CEP: ViaCEP direto do navegador

**Decisão**: chamada direta do navegador ao ViaCEP com `HttpClient`, em `domain/local/apis/cep.api.ts`, **sem** estender `BaseApi` e **sem** `withCredentials`. Timeout de 5 s via `timeout()` do RxJS. Sem dependência npm nova.

**Comportamento do ViaCEP — verificado por requisição real em 2026-07-31**, não presumido:

| Situação | Status | Corpo |
|---|---|---|
| CEP existente (`38408100`) | **200** | `{"cep":"38408-100","logradouro":"Avenida João Naves de Ávila","bairro":"Saraiva","localidade":"Uberlândia","uf":"MG", …}` |
| CEP bem formado, inexistente (`99999999`) | **200** | `{"erro":"true"}` |
| CEP mal formado (`3840810`) | **400** | corpo **HTML**, não JSON |

Três achados que mudam a implementação e corrigem o que eu havia assumido:

1. **CEP inexistente responde 200, não 404.** A detecção é pelo campo `erro` no corpo. Um `catchError` sozinho nunca perceberia.
2. **O valor de `erro` é a string `"true"`, não o booleano `true`.** Testar `if (resposta.erro)` funciona por *truthiness*, mas comparar com `=== true` falharia. O código deve tratar o campo como *truthy*, sem assumir o tipo.
3. **CEP mal formado devolve HTML com 400**, então o parser de JSON quebra antes do `catchError` de HTTP. A validação de formato (oito dígitos) acontece **antes** de qualquer chamada, o que torna esse caso inalcançável na prática — mas o tratamento de falha genérica cobre.

O campo `complemento` do ViaCEP **não** é aproveitado: ele traz faixa de numeração ("de 1260 a 3630 - lado par"), não complemento de imóvel. Mapeamos apenas `logradouro → rua`, `bairro → bairro`, `localidade → cidade`, `uf → UF`.

`Access-Control-Allow-Origin: *` confirmado na resposta, então a chamada direta do navegador funciona sem proxy.

**Sobre o `autenticacaoErroInterceptor`**: ele intercepta toda resposta do `HttpClient`, inclusive de terceiros. É seguro aqui porque só reage a **401**, e o ViaCEP nunca responde 401. Ainda assim, o serviço de CEP não envia `withCredentials`, garantindo que o cookie de sessão e o token CSRF nunca saiam para domínio externo (Art. 7.4).

**Alternativas rejeitadas**:
- *Proxy pela própria API* (`GET /api/cep/{cep}`): acoplaria a API a um terceiro, adicionaria latência (navegador → Render → ViaCEP) e um endpoint a manter e testar. Justificável se o ViaCEP não tivesse CORS aberto — mas tem.
- *Dependência `cep-promise`*: abstrai múltiplos provedores com *fallback*, o que é atraente, mas não usa o `HttpClient` — perderíamos o `HttpTestingController` nos testes e ganharíamos peso no bundle por um ganho que a FR-013 já torna opcional (a indisponibilidade é degradação aceita, não falha).

---

## D4 — Estilo do filtro de coluna: menu de funil

**Decisão**: `p-table` com `[filterDisplay]="'menu'"` e um `p-column-filter` por coluna, com `display="menu"`. Tipos: `type="text"` para nome, `type="numeric"` para litros, e template `#filter` com `p-select` + `matchMode="equals"` para tipo e situação.

**Racional**: é o que o desenho de referência mostra — ícone de funil no cabeçalho ao lado do indicador de ordenação, sem segunda linha de controles. O menu também é o único dos dois estilos que expõe **operador de comparação** ao Gestor ("contém", "começa com", "maior que"), o que a FR-016 pede ao falar de "critérios de comparação adequados ao tipo do dado".

**Registro de divergência da documentação**: nas versões atuais os demos do PrimeNG, incluindo o que se chama `filter-advanced`, usam `[showMenu]="false"` com filtros **em linha** — não o menu. O termo "filter advanced" nomeia, na documentação, o estilo oposto ao que foi adotado. A escolha do menu é decisão de produto, confirmada com o responsável, e está registrada aqui para que ninguém a "corrija" depois olhando só a documentação.

---

## D5 — Filtro inicial em "Ativo"

**Decisão**: semear o filtro da coluna de situação programaticamente após a carga dos dados, via referência à tabela (`viewChild(Table)`), aplicando `equals` com o valor "ativo". Um botão explícito **"Limpar filtros"** ao lado do contador devolve a visão completa.

**Racional**: a RN-G-06 exige abrir mostrando apenas ativos (FR-018), mas o conjunto carregado é completo (FR-017). Semear o filtro em vez de filtrar a fonte mantém uma única lista na memória e faz o contador "exibidos de total" (FR-019) cair naturalmente de `filteredValue` versus `value`.

**Alternativa rejeitada**: carregar só ativos e buscar arquivados sob demanda quando o filtro muda. Simples no primeiro carregamento, mas quebra o contador de total e transforma cada troca de filtro em requisição — contrariando a premissa de filtragem no cliente.

---

## D6 — Litros por local

**Decisão**: nova `ImpactoApi` em `domain/impacto/apis/impacto.api.ts` consumindo `GET /api/impacto/valor-social/por-local`, chamada **em paralelo** à listagem de locais, com junção por `localId` num `computed()`. Nenhuma mudança no backend.

**Três estados distintos, deliberadamente não confundidos**:

| Estado | Origem | Exibição |
|---|---|---|
| Local sem coleta | ausente do agregado | `0 L` (FR-020) |
| Local com coleta | presente no agregado | valor formatado |
| Agregado indisponível | a chamada de impacto falhou | `—` e aviso discreto |

A distinção importa: exibir `0 L` quando o serviço de impacto caiu diria ao Gestor que o local não opera, o que é falso. A lista de locais renderiza normalmente nesse cenário — a falha do impacto degrada uma coluna, não a tela.

---

## D7 — Carregar ativos e arquivados

**Decisão**: duas chamadas em paralelo ao endpoint existente (`arquivados=false` e `arquivados=true`), concatenadas no cliente. O contrato da API **não muda**.

**Racional**: preserva o contrato entregue na CA-01 e seus testes intactos. Duas requisições contra dezenas de registros é custo irrelevante, e o spec já assume filtragem no cliente.

**Alternativa rejeitada**: aceitar `arquivados=todos` (ou omitir o parâmetro para trazer tudo). Mais econômico em rede, mas altera um contrato já publicado e testado por uma feature anterior, para ganho desprezível na escala atual.

---

## D8 — Drawer compartilhado

**Decisão**: `widget/components/form-drawer/form-drawer.component.ts`, envolvendo `p-drawer`.

- **Entradas**: `visivel` (model, two-way), `titulo`, `trilha` (itens de breadcrumb), `salvarDesabilitado`, `salvando`, `rotuloSalvar`
- **Saídas**: `salvar`, `cancelar`
- **Conteúdo**: `<ng-content>` — o formulário é responsabilidade de quem hospeda
- **Header e footer fixos**: templates `#header` e `#footer` do `p-drawer`; o corpo é a única área que rola (confirmado no exemplo `template` da documentação)
- **Posição responsiva**: `position` alternando `right` (≥ **768 px**) e `bottom` (< 768 px), por um signal alimentado por `matchMedia('(min-width: 768px)')`, sem duplicar markup. O valor não é novo: **768 px é a fronteira tablet/mobile na tabela de breakpoints de `docs/design.md`**, a mesma onde a sidebar do painel muda de comportamento. Não confundir com os 360 px do SC-008, que é o piso de largura utilizável, não o ponto de virada

**Racional**: as três regras de UI (posição por viewport, cabeçalho e rodapé fixos, breadcrumb acima do título) valem para todos os cadastros do sistema. Implementá-las uma vez em `widget/` — a camada que o refactor de arquitetura destinou a UI sem conhecimento de domínio — evita que Pontos e Coletas as reimplementem divergindo.

**Empilhamento**: `p-drawer` é overlay com zIndex gerenciado, então drawer sobre drawer deve funcionar por ordem de abertura. **Não validado nesta feature** — Local não tem campo derivado, e a primeira aplicação real é na tela de Pontos. Registrado como risco a confirmar lá, não como fato.

---

## D9 — Máscara de CEP

**Decisão**: diretiva **`pInputMask="99999-999"`** sobre um `<input pInputText>`, com o valor de oito dígitos **derivado** do modelo mascarado.

> **Duas correções sobre a primeira versão desta decisão**, ambas descobertas ao abrir o exemplo `unmask` da documentação durante a implementação:
>
> 1. **Não existe componente `<p-inputmask>` nesta versão** — a máscara é uma **diretiva** aplicada a um input nativo: `<input pInputText pInputMask="99999-999">`.
> 2. **`onUnmaskedChange` foi descartado.** Ele emite a string crua corretamente ao digitar, mas **não dispara em atribuição programática do modelo**. Na edição de um local existente, o CEP pré-preenchido nunca chegaria ao valor cru, e o botão salvar ficaria travado com o formulário visivelmente completo — bug silencioso e difícil de rastrear.

**Racional**: derivar os dígitos do modelo mascarado (`cepMascarado().replace(/\D/g, '')`) tem uma única fonte de verdade e funciona igual nos dois caminhos — digitação e pré-preenchimento. Resolve a mesma tensão entre FR-005 (interface legível, `38408-100`) e o armazenamento canônico de oito dígitos, sem depender de um evento que só cobre metade dos casos.

Atenção ao `autoClear`, que por padrão **limpa o valor quando a máscara está incompleta** ao perder o foco. Para o CEP isso é desejável: um CEP parcial não deve disparar consulta nem ser salvo.

---

## D10 — Formato do CEP no contrato da API

**Decisão**: a API recebe e devolve o CEP como **oito dígitos sem formatação** (`"38408100"`), validado por `@Pattern("\\d{8}")`. A formatação é responsabilidade da interface.

**Racional**: um único formato canônico no armazenamento elimina a pergunta "com ou sem hífen?" em toda comparação, ordenação e futura deduplicação de endereço. A máscara do D9 já entrega o valor cru sem trabalho extra.

---

## Riscos registrados

| Risco | Mitigação |
|---|---|
| A fase *contract* (endurecer para `NOT NULL`) pode nunca acontecer, deixando o schema permanentemente permissivo | Registrado como dívida explícita aqui e em `data-model.md`; a validação no servidor garante que **novos** cadastros sempre venham completos |
| Empilhamento de drawers não validado | Só é exercitado na tela de Pontos; se falhar, a alternativa é o segundo nível virar `p-dialog` sobre o drawer |
| ViaCEP fora do ar durante a demonstração | FR-013 já exige que o cadastro siga manualmente; o cenário está nos critérios de aceite e será testado |
| 13 arquivos de teste do backend referenciam `endereco` | São reescritos na fase Red, antes de qualquer mudança em código de produção (Art. 5.2) |
