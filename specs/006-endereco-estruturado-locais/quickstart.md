# Quickstart — validar a feature 006

**Feature**: `006-endereco-estruturado-locais` · **Data**: 2026-07-31

Como rodar e verificar que a feature funciona ponta a ponta. Requisitos e contratos detalhados estão em [data-model.md](data-model.md) e [contracts/locais.md](contracts/locais.md).

---

## Pré-requisitos

- Docker em execução (o Java vive só em container — Art. 1.6)
- Node no host, dependências do frontend instaladas (`cd frontend && npm ci`)

## Subir o ambiente

```bash
# API + Postgres local, a partir da raiz do repositório
docker compose -f infra/docker-compose.yml up --build
```

O start deve mostrar o Flyway aplicando a **V6**. Se a base local já tinha locais cadastrados, confira o resultado da migração:

```sql
-- espera-se: rua preenchida com o texto antigo, demais componentes nulos
select nome, endereco_legado, rua, cep, uf from local where endereco_legado is not null;
```

```bash
cd frontend
npm start          # http://localhost:4200
```

## Rodar os testes

```bash
# Backend, dentro do Docker (Art. 5.3)
docker run --rm -v "$PWD/api":/app -v /var/run/docker.sock:/var/run/docker.sock \
  -w /app maven:3.9-eclipse-temurin-21 mvn -B verify

# Frontend
cd frontend && npm test -- --watch=false
```

> No Windows, o mount do socket do Docker pode não funcionar; nesse caso os testes com Testcontainers rodam no CI. Testes unitários que não sobem contexto Spring rodam localmente sem o socket.

---

## Roteiro de validação

Autentique-se como Gestor e vá para **Locais**.

### 1. Endereço estruturado (US1)

1. Clique em **Novo local**. O painel abre à direita, com breadcrumb `Home › Locais › Novo` acima do título.
2. Confirme que **Salvar está desabilitado** com o formulário vazio.
3. Preencha nome e tipo, e o endereço campo a campo. Deixe o **complemento vazio**.
4. Salvar habilita. Salve → o local aparece na lista.
5. Reabra o local para edição → cada componente volta no seu campo.
6. Altere **só o número** e salve → apenas ele muda.

**Rejeições esperadas**: obrigatório em branco mantém Salvar desabilitado; CEP com menos de 8 dígitos é recusado; UF fora da lista não é oferecida (é um select).

### 2. Preenchimento por CEP (US3)

| Entrada | Esperado |
|---|---|
| `38408-100` | rua, bairro, cidade e UF preenchidos (Avenida João Naves de Ávila · Saraiva · Uberlândia · MG) |
| `99999-999` | aviso de **não encontrado**; os campos seguem editáveis e o cadastro é possível |
| rede offline (DevTools) | aviso de **consulta indisponível**; cadastro segue manualmente |
| trocar por outro CEP válido | rua, bairro, cidade e UF são atualizados |
| corrigir a rua à mão e salvar | a correção prevalece sobre o valor consultado |

O caso de indisponibilidade é o mais importante: **a FR-013 exige que nenhum cadastro fique bloqueado** por falha do serviço externo.

### 3. Visão geral e filtros (US2)

1. Abrir a lista → só **ativos** aparecem, e o contador mostra `N de M locais` com `M` incluindo arquivados.
2. Clicar no funil de **Status** e trocar para "arquivado" → só arquivados.
3. Funil de **Tipo** → "escola" → só escolas.
4. Funil de **Litros** → operador "maior que" com um valor → só locais acima dele.
5. Funil de **Local** → operador "contém" com um trecho do nome.
6. Filtro sem correspondência → mensagem de **nenhum resultado para o filtro**, distinta de lista vazia.
7. **Limpar filtros** → volta a ver todos, inclusive arquivados.
8. Local sem coleta → mostra `0 L`, não em branco.

### 4. Painel de cadastro (US4)

1. Com o painel aberto, rolar o formulário → breadcrumb, título e botões **permanecem visíveis**.
2. Reduzir a janela abaixo do breakpoint → o painel passa a subir **de baixo para cima** e ocupa a largura disponível.
3. Em 360 px de largura, o formulário é utilizável **sem rolagem horizontal**.
4. Preencher campos e **Cancelar** → nada é salvo e a lista fica como estava.

---

## Verificações de contrato pela API

Com sessão ativa (obtenha o cookie via `POST /api/auth/login` e o token via `GET /api/auth/csrf`):

```bash
# 400 — CEP com formato inválido
curl -X POST http://localhost:8080/api/locais \
  -H 'Content-Type: application/json' -H "X-XSRF-TOKEN: $TOKEN" -b cookies.txt \
  -d '{"nome":"Teste","tipo":"ESCOLA","cep":"123","rua":"R","numero":"1","bairro":"B","cidade":"C","uf":"MG"}'

# 400 — obrigatório com apenas espaços
#   "bairro": "   "  →  campo listado no mapa de erros

# 201 — complemento ausente é aceito
curl -X POST http://localhost:8080/api/locais \
  -H 'Content-Type: application/json' -H "X-XSRF-TOKEN: $TOKEN" -b cookies.txt \
  -d '{"nome":"Escola A","tipo":"ESCOLA","cep":"38408100","rua":"Av. João Naves","numero":"1841","bairro":"Saraiva","cidade":"Uberlândia","uf":"MG"}'
```

A validação precisa reprovar **no servidor** mesmo quando a interface já reprovaria (FR-009) — por isso a checagem por `curl`, contornando o formulário, faz parte do roteiro.

---

## Critérios de conclusão

- [ ] `mvn verify` verde no Docker e `npm test` verde
- [ ] Roteiros 1 a 4 executados no navegador
- [ ] Verificações de contrato por `curl` respondendo os status esperados
- [ ] Migração V6 conferida numa base **com** dados e numa base **vazia**
- [ ] CI verde antes de qualquer merge (Art. 5.5)
