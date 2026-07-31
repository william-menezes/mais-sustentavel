# Deploy — Supabase + Render + Vercel

Guia para colocar a **API** no ar na Render (banco no **Supabase**) e o **frontend** na Vercel.

> Ordem: **1) Supabase** (para ter a string de conexão) → **2) Render** (usa essa string) →
> **3) Vercel** (reescreve `/api` para a Render).
>
> As duas pontas se referenciam, e os dois domínios são previsíveis pelos nomes dos projetos
> (`mais-sustentavel-api.onrender.com` e `<projeto>.vercel.app`), então não há impasse: a
> Vercel já vem com a URL da Render no [`frontend/vercel.json`](../frontend/vercel.json), e a
> Render recebe o domínio da Vercel em `APP_PONTO_BASE_URL`. Se o domínio da Vercel sair
> diferente do esperado, corrija `APP_PONTO_BASE_URL` **antes de cadastrar o primeiro ponto**.

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
| `SEED_GESTOR_EMAIL` | e-mail do gestor inicial |
| `SEED_GESTOR_SENHA` | senha do gestor inicial |
| `APP_PONTO_BASE_URL` | `https://<projeto>.vercel.app` |

**As três últimas são fáceis de esquecer e falham em silêncio:**

- **`SEED_GESTOR_*`** — o `GestorSeeder` só cria a primeira conta quando as **duas** existem.
  Sem elas o banco sobe com o schema completo e **zero usuários**, e não há como fazer login.
  O seeder é idempotente: depois de criado, novos deploys não recriam nem trocam a senha.
  Para trocar a senha depois, altere no banco — mudar a variável não tem efeito.
- **`APP_PONTO_BASE_URL`** — é gravada em `ponto.qr_conteudo` **no momento em que o ponto é
  criado**, e a imagem do QR é sempre regenerada a partir desse valor guardado. Se estiver
  errada (o default é `http://localhost:4200`), o QR impresso e colado no ponto físico aponta
  para localhost **para sempre**. Acerte-a **antes de cadastrar o primeiro ponto**.

> `APP_CORS_ORIGINS` não é necessária: o frontend chama a API pela reescrita da Vercel
> (mesma origem), então o navegador nunca faz requisição cross-origin. O default restrito a
> `localhost:4200` continua valendo como proteção para acesso direto ao domínio da Render.

> **Migrações e RLS:** o Flyway roda sozinho no start da API e cria o histórico + a migração `V1` (pgcrypto).
> As tabelas de domínio e o **RLS** entram pelas próximas features (a partir de AC-01), sempre via migração —
> nunca criadas à mão no painel (Art. 7.2).

---

## 2. Render (API em Docker)

Você tem duas opções — o **Blueprint** é o mais rápido:

### Opção A — Blueprint (recomendado)

1. Em https://render.com → **New** → **Blueprint**.
2. Conecte o GitHub e selecione **`william-menezes/mais-sustentavel`**. A Render lê o [`render.yaml`](../render.yaml).
3. Ela vai pedir as variáveis declaradas com `sync: false` (as 3 do banco + `SEED_GESTOR_EMAIL`, `SEED_GESTOR_SENHA` e `APP_PONTO_BASE_URL`) — cole os valores da tabela acima.
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
3. **Environment** → adicione as 6 variáveis da tabela acima.
4. **Create Web Service**.

> A porta é injetada pela Render via `PORT`; a aplicação já lê `${PORT:8080}`.

---

## 3. Vercel (frontend)

O [`frontend/vercel.json`](../frontend/vercel.json) já carrega a configuração de build e de
rotas; no painel basta apontar a raiz do projeto.

1. Em https://vercel.com → **Add New** → **Project** → selecione **`william-menezes/mais-sustentavel`**.
2. Em **Settings → Build and Deployment**:
   - **Root Directory:** `frontend`  ← importante (é onde está o `package.json` do front)
   - **Framework Preset:** `Other` — o `vercel.json` já informa build e saída, então o preset
     não precisa adivinhar.
   - **Build Command / Output Directory:** deixe **sem override**. Quem manda é o `vercel.json`
     (`npm run build` e `dist/frontend/browser`).
3. **Deploy**.

> ⚠️ Com o preset `Other` e o Output Directory vazio, a Vercel serve `public/` ou a **própria
> raiz** do projeto. Como o Angular não gera `index.html` ali, o resultado é
> **404: NOT_FOUND** na home — foi exatamente o que aconteceu no primeiro deploy, antes do
> `vercel.json`.

### Por que o `vercel.json` é necessário

- **Saída do build:** o builder `@angular/build:application` emite em
  `dist/frontend/`**`browser`**`/`. Sem `outputDirectory`, a Vercel procura o `index.html` um
  nível acima, não encontra e responde **404: NOT_FOUND** já na raiz.
- **Rotas do SPA:** o Angular resolve `/painel`, `/locais`, `/locais/:id/pontos` no cliente.
  Sem a reescrita final para `/index.html`, recarregar numa rota profunda dá 404 da Vercel.
- **Chamadas à API:** o [`proxy.conf.json`](../frontend/proxy.conf.json) só existe no
  `ng serve`. Em produção, a reescrita `/api/:caminho*` → Render faz esse papel. Como o
  navegador continua vendo **mesma origem**, o cookie de sessão (HttpOnly) e o `XSRF-TOKEN`
  funcionam sem CORS e sem `SameSite=None` — coerente com a sessão por cookie (Art. 7).

> A ordem das reescritas importa: `/api/*` vem **antes** do catch-all do SPA.
> Se o nome do serviço na Render mudar, atualize o `destination` no `vercel.json`.

---

## 4. Validar

- Acompanhe os logs na Render: o start deve mostrar o **Flyway migrando** (`V1`) e o Tomcat na porta.
  Se o Flyway conectar, a ligação com o Supabase está OK.
- Depois de "Live", acesse:
  ```
  https://mais-sustentavel-api.onrender.com/actuator/health   →  {"status":"UP"}
  ```
  `UP` confirma app + banco saudáveis (o resto da API responde 401 até a AC-01 implementar o login).

No frontend, depois do deploy na Vercel:

- A **raiz** (`/`) deve abrir a home. Se vier **404: NOT_FOUND**, o `outputDirectory` não está
  casando com a saída do build.
- Uma **rota profunda** recarregada (`/locais`) deve abrir a aplicação, não 404 — confirma o
  catch-all do SPA.
- A **reescrita da API** responde através do domínio da Vercel:
  ```
  https://<projeto>.vercel.app/api/auth/csrf   →  200 + Set-Cookie: XSRF-TOKEN
  ```
  Se isso funciona, o login funciona: é o mesmo caminho que a sessão usa.

## 5. Notas

- **Free tier:** o serviço hiberna após inatividade; a primeira requisição "acorda" (alguns segundos). Suficiente para o trabalho.
- **Branches/ambientes:** este blueprint usa `main` (produção). Um serviço de homologação pode ser criado depois apontando para `homolog`.
- **Segredos:** só no painel da Render/Supabase. Nunca commite senhas (`.gitignore` já cobre `.env`).