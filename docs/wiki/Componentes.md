# Projeto de Componentes (Módulos)

O sistema é dividido em dois artefatos implantáveis — **API** (backend) e **SPA** (frontend) — cada um organizado em **módulos coesos**. O backend agrupa por **domínio**, com camadas internas `web → service → repository → domínio`; o frontend agrupa por **feature** (`domain/`) sobre uma base transversal (`core/`) e componentes reutilizáveis (`shared/`, `widget/`).

## Backend — módulos de domínio e dependências

Cada módulo do backend (`br.com.maissustentavel.api.<módulo>`) é autocontido e expõe seus endpoints REST. As dependências entre módulos seguem as regras do domínio (um ponto pertence a um local; uma coleta pertence a um ponto e registra um coletor; o impacto agrega coletas). O módulo `config` (Spring Security) é **transversal**.

```mermaid
flowchart LR
    subgraph API["API Spring Boot · br.com.maissustentavel.api"]
        auth["🔑 auth<br/>usuário · papéis (RBAC)<br/>login/sessão · seed do Gestor"]
        local["🏢 local<br/>instituições atendidas<br/>(soft delete)"]
        ponto["📍 ponto<br/>estações físicas + QR Code<br/>(ZXing)"]
        coleta["🛢️ coleta<br/>litros reais por ponto<br/>(imutável)"]
        impacto["📊 impacto<br/>valor social<br/>(total · por local · mensal)"]
        config["🛡️ config<br/>Spring Security 7<br/>CSRF · CORS · filtros"]
    end
    db[("PostgreSQL + RLS<br/>Flyway")]

    ponto --> local
    coleta --> ponto
    coleta --> auth
    impacto --> coleta
    config -. protege .-> auth
    config -. protege .-> local
    config -. protege .-> ponto
    config -. protege .-> coleta
    config -. protege .-> impacto
    auth --> db
    local --> db
    ponto --> db
    coleta --> db
    impacto -->|somente leitura| db

    classDef mod fill:#0E9E6E,stroke:#0B6B4F,color:#ffffff;
    classDef sec fill:#1C8FB5,stroke:#0E5C7D,color:#ffffff;
    classDef data fill:#11332E,stroke:#08201B,color:#ffffff;
    class auth,local,ponto,coleta,impacto mod;
    class config sec;
    class db data;
```

| Módulo | Responsabilidade | Destaques |
|--------|------------------|-----------|
| **auth** | Autenticação por sessão, papéis (RBAC N:N), _seed_ do Gestor | Spring Security, BCrypt, anti-enumeração, rate limit de login |
| **local** | Cadastro de locais (instituições) | Soft delete (RN-G-06) |
| **ponto** | Pontos de coleta e **QR Code** único por ponto | Geração do QR com ZXing; QR = URL do app |
| **coleta** | Registro de litros reais medidos num ponto | Registro **imutável** (append-only) |
| **impacto** | Agregação do **valor social** (R$ 1,00 × litro) | Somente leitura; total, por local e série mensal |
| **config** | Segurança transversal | CSRF _double-submit_, CORS restrito |

## Backend — camadas internas de um módulo

Todos os módulos seguem a mesma arquitetura em camadas (Art. 1): a regra de negócio vive no **service**/domínio, nunca no controller.

```mermaid
flowchart LR
    HTTP(["HTTP /api/..."]) --> C["Controller<br/>(web + DTOs)"]
    C --> S["Service<br/>(regra de negócio)"]
    S --> R["Repository<br/>(Spring Data JPA)"]
    R --> D["Domain<br/>(entidade JPA)"]
    R --> DB[("PostgreSQL")]
    C -. erros .-> EH["ExceptionHandler<br/>(mensagens genéricas pt-BR)"]

    classDef l fill:#EEF3EC,stroke:#0B6B4F,color:#11332E;
    class C,S,R,D,EH l;
```

## Frontend — módulos da SPA

O frontend (Angular 22 _standalone_ + _signals_) separa **features de domínio** (`domain/`), **infraestrutura transversal** (`core/`) e **componentes reutilizáveis** (`shared/`, `widget/`). Cada feature tem `pages`, `components`, `interfaces` e `apis` (serviços que falam com a API).

```mermaid
flowchart TB
    subgraph CORE["core · transversal"]
        guard["guards<br/>(autenticação de rota)"]
        interc["interceptors<br/>(erro 401)"]
        i18n["i18n (pt-BR)"]
        layout["layout (painel)"]
    end

    subgraph DOMAIN["domain · features"]
        dauth["auth<br/>(login)"]
        dlocal["local<br/>(locais)"]
        dponto["ponto<br/>(pontos + QR)"]
        dcoleta["coleta<br/>(coletas)"]
        dimpacto["impacto<br/>(painel)"]
    end

    subgraph REUSE["shared / widget · reutilizáveis"]
        sidebar["sidebar"]
        header["header"]
        drawer["form-drawer"]
    end

    API[("API REST · /api<br/>(proxy Vercel → Render)")]

    CORE --> DOMAIN
    DOMAIN --> REUSE
    DOMAIN -->|"HttpClient (apis) · withCredentials"| API

    classDef core fill:#1C8FB5,stroke:#0E5C7D,color:#ffffff;
    classDef feat fill:#0E9E6E,stroke:#0B6B4F,color:#ffffff;
    classDef reuse fill:#F4B53F,stroke:#B8801F,color:#11332E;
    classDef api fill:#11332E,stroke:#08201B,color:#ffffff;
    class guard,interc,i18n,layout core;
    class dauth,dlocal,dponto,dcoleta,dimpacto feat;
    class sidebar,header,drawer reuse;
    class API api;
```

| Camada | Papel |
|--------|-------|
| **core** | _Guards_ de rota, _interceptor_ de erro de autenticação, i18n (pt-BR), _layout_ do painel, página inicial |
| **domain** | Uma pasta por _feature_ (`auth`, `local`, `ponto`, `coleta`, `impacto`), cada uma com `pages`, `components`, `interfaces` e `apis` |
| **shared / widget** | Componentes reutilizáveis entre features — **sidebar**, **header**, **form-drawer** e afins |

> **Correspondência back ↔ front:** cada _feature_ do frontend consome os endpoints do módulo homônimo do backend (ex.: `domain/coleta` → `POST/GET /api/pontos/{id}/coletas`; `domain/impacto` → `GET /api/impacto/valor-social`).
