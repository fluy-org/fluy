# Bloco 0 — Fundação

Setup do projeto. Sem valor de negócio direto, mas destrava tudo.

**Divisão combinada:** 🔵 Leandro fica no lado Angular do setup, 🟣 Rudney no lado Nest. As fatias de infra (docker, CI, deploy) ficam com quem terminar primeiro o setup do seu lado.

## Entregável do bloco

Ao final, deve ser possível:
- Subir tudo local com `docker compose up`.
- Rodar `POST /auth/login` no back e receber um token.
- Angular sobe, tem rotas pública e autenticada, guard funcionando, interceptor injetando token.
- Fazer push em `main` e ver deploy automático em staging.

Sem tela de negócio ainda — as primeiras telas reais são do Bloco 1 (login com UX + onboarding).

## Fatias

### Setup geral

- [ ] **0.1** Setup do mono-repo (workspaces npm, `docker-compose` com Postgres, scripts na raiz, `.env` template, `tsconfig` base com path mapping para `shared/`) — **🟣 Rudney**

### Backend (Nest)

- [ ] **0.2** Setup NestJS: config module, TypeORM, module `salao`, entities `salao`, `usuario_salao`, `metodo_autenticacao_usuario`, `configuracao_salao` — **🟣 Rudney**
- [ ] **0.3** Autenticação backend: endpoint `POST /auth/login` (email+senha) + endpoint `POST /auth/oauth/google` (mock por enquanto) + guard multi-tenant que injeta `salao_id` no request — **🟣 Rudney**
- [ ] **0.4** Migration inicial única cobrindo entidades do Bloco 0 + `profissional` + `cliente` + `arquivo` (as 3 entidades "compartilhadas" nascem cedo para evitar conflito nos blocos 1 e 2) — **🟣 Rudney**

### Frontend (Angular)

- [ ] **0.5** Criar projeto Angular no workspace (Angular CLI, strict mode, sem SSR, roteamento habilitado, SCSS ou CSS puro conforme decisão abaixo) — **🔵 Leandro**
- [ ] **0.6** Definir e aplicar estrutura de pastas: `core/` (services singleton, guards, interceptors), `shared/` (componentes reutilizáveis), `features/` (uma pasta por feature futura), `layouts/` (público e autenticado) — **🔵 Leandro**
- [ ] **0.7** Sistema de rotas: rotas públicas (login, cadastro salão, página do cliente) vs. autenticadas (painel do salão). Guard de auth. Path mapping do `shared/` funcionando (importar DTOs sem `../../../`). — **🔵 Leandro**
- [ ] **0.8** Service de autenticação + HttpInterceptor: login/logout, armazenar token, injetar Authorization no header, tratar 401 (deslogar). Consome `POST /auth/login` do 0.3. — **🔵 Leandro**
- [ ] **0.9** Layouts (público e autenticado): shell autenticado com header, menu lateral vazio (features vão preencher depois), área com `<router-outlet>`. Layout público sem menu. — **🔵 Leandro**

### Infra

- [ ] **0.10** Pipeline CI (typecheck + build de back e front a cada push) — **livre** (quem terminar primeiro)
- [ ] **0.11** Ambiente staging deployado + deploy automático em merge para `main` — **livre** (quem terminar primeiro)

## Decisões pendentes deste bloco (decidir ANTES de começar, não no meio)

### Backend
- [ ] Hoster de staging (Railway / Render / Fly / outro).
- [ ] OAuth Google — usar credenciais mockadas até quando? Antes do Bloco 4 precisa estar real.
- [ ] Estrutura de pastas em `shared/` (só types? enums? Zod schemas?).

### Frontend
- [ ] **UI kit** — Angular Material, PrimeNG, Tailwind + headless, ou CSS puro? Impacta 20+ telas depois; decidir agora evita retrabalho.
- [ ] **Standalone components vs. NgModules** — Angular 17+ recomenda standalone; decidir e seguir consistente.
- [ ] **Onde guardar o token de auth** — localStorage, sessionStorage, cookie httpOnly? (segurança vs. simplicidade).
- [ ] **State management** — precisa de NgRx/Signals Store agora ou services + Signals são suficientes? MVP: services + Signals.

## Notas

- **0.4** cria migration única com entidades do Bloco 0 + as 3 "compartilhadas" (`profissional`, `cliente`, `arquivo`). Motivo: essas 3 são usadas por múltiplas fatias em blocos futuros — nascer cedo evita colisão de migration depois. Elas nascem sem service/controller no Bloco 0; só a tabela.
- Depois desta migration inicial, cada fatia gera sua própria migration incremental (comando `typeorm migration:generate`).
- **Sequência sugerida no Angular:** 0.5 → 0.6 → 0.7 → 0.8 → 0.9 (uma alimenta a próxima). Podem ir juntas em ~2-3 PRs se forem pequenas; ou uma por PR se preferir revisão fina.
- **Sem tela `/me` de teste** — o Bloco 1 já traz login real (1.2) e onboarding (1.1). Se o interceptor/guard tiver bug, aparece lá.
