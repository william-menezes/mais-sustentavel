# Deploy — Supabase + Render

Guia para colocar a **API** no ar na Render, com o banco no **Supabase**.
O frontend (Vercel) tem um guia separado (a fazer).

> Ordem: **1) Supabase** (para ter a string de conexão) → **2) Render** (usa essa string).

---

## 1. Supabase (banco PostgreSQL + RLS)

1. Crie a conta em https://supabase.com e clique **New project**.
   - **Name:** `mais-sustentavel`
   - **Database Password:** gere uma senha forte e **guarde** (você vai usá-la na Render).
   - **Region:** escolha a mais próxima (ex.: `South America (São Paulo)`).
2. Aguarde o provisionamento (~2 min).
3. Clique em **Connect** (topo do projeto) → aba **Connection string**.
   - Escolha o **Session pooler** (compatível com IPv4 e ideal para servidor com pool de conexões — a Render usa IPv4). **Evite** a conexão direta (IPv6) e o Transaction pooler (6543).
   - Anote os campos. O pooler tem o formato:
     - **Host:** `aws-0-<regiao>.pooler.supabase.com`
     - **Port:** `5432`
     - **Database:** `postgres`
     - **User:** `postgres.<project-ref>`
     - **Password:** a que você definiu no passo 1.

Com isso, os valores para a Render são:

| Variável | Valor |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-<regiao>.pooler.supabase.com:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
| `SPRING_DATASOURCE_PASSWORD` | *(a senha do banco)* |

> **Migrações e RLS:** o Flyway roda sozinho no start da API e cria o histórico + a migração `V1` (pgcrypto).
> As tabelas de domínio e o **RLS** entram pelas próximas features (a partir de AC-01), sempre via migração —
> nunca criadas à mão no painel (Art. 7.2).

---

## 2. Render (API em Docker)

Você tem duas opções — o **Blueprint** é o mais rápido:

### Opção A — Blueprint (recomendado)

1. Em https://render.com → **New** → **Blueprint**.
2. Conecte o GitHub e selecione **`william-menezes/mais-sustentavel`**. A Render lê o [`render.yaml`](../render.yaml).
3. Ela vai pedir os 3 segredos (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) — cole os valores da tabela acima.
4. **Apply** → a Render builda a imagem (`api/Dockerfile`) e sobe.

### Opção B — Manual (New Web Service)

1. **New** → **Web Service** → conecte o repositório.
2. Configure:
   - **Language/Runtime:** Docker
   - **Branch:** `main`
   - **Root Directory:** `api`  ← importante (o contexto do Docker é esta pasta)
   - **Dockerfile Path:** `./Dockerfile` (relativo ao Root Directory)
   - **Health Check Path:** `/actuator/health`
   - **Instance Type:** Free
3. **Environment** → adicione as 3 variáveis da tabela acima.
4. **Create Web Service**.

> A porta é injetada pela Render via `PORT`; a aplicação já lê `${PORT:8080}`.

---

## 3. Validar

- Acompanhe os logs na Render: o start deve mostrar o **Flyway migrando** (`V1`) e o Tomcat na porta.
  Se o Flyway conectar, a ligação com o Supabase está OK.
- Depois de "Live", acesse:
  ```
  https://mais-sustentavel-api.onrender.com/actuator/health   →  {"status":"UP"}
  ```
  `UP` confirma app + banco saudáveis (o resto da API responde 401 até a AC-01 implementar o login).

## 4. Notas

- **Free tier:** o serviço hiberna após inatividade; a primeira requisição "acorda" (alguns segundos). Suficiente para o trabalho.
- **Branches/ambientes:** este blueprint usa `main` (produção). Um serviço de homologação pode ser criado depois apontando para `homolog`.
- **Segredos:** só no painel da Render/Supabase. Nunca commite senhas (`.gitignore` já cobre `.env`).