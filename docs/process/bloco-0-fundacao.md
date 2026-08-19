# Bloco 0 — Fundação

Setup do projeto. Sem valor de negócio direto, mas destrava tudo.

**Divisão combinada:** 🔵 Leandro fica no lado Angular do setup, 🟣 Rudney no lado Nest. As fatias de infra (docker, CI, deploy) ficam com quem terminar primeiro o setup do seu lado.

## Entregável do bloco

Ao final, deve ser possível:

- Subir tudo local com `docker compose up`.
- Criar uma conta no Clerk, confirmar o e-mail e materializar a conta global
  pelo backend.
- Angular sobe, tem rotas pública e autenticada, guard funcionando e envia o
  token Bearer da sessão Clerk.
- Fazer push em `main` e ver deploy automático em staging.

Sem tela de negócio ainda — as primeiras telas reais são do Bloco 1 (login com UX + onboarding).

## Fatias

### Setup geral

- [x] **0.1** Setup do mono-repo (workspaces npm, `docker-compose` com Postgres, scripts na raiz, `.env` template, `tsconfig` base com path mapping para `shared/`) — **🟣 Rudney**

### Backend (Nest)

- [x] **0.2** Setup NestJS: config module, Drizzle (cliente + provider injetável), module `salao` inicial — **🟣 Rudney**
- [x] **0.3** Autenticação backend: provider Clerk, guard global que valida o Bearer token e identidade autenticada, `POST /usuarios` idempotente e `GET /usuarios/eu` para a conta global — **🟣 Rudney**
- [x] **0.4** Criação inicial do banco de dados — **🟣 Rudney**

### Frontend (Angular)

- [x] **0.5** Criar projeto Angular no workspace (Angular CLI, strict mode, sem SSR, roteamento habilitado, SCSS ou CSS puro conforme decisão abaixo) — **🔵 Leandro**
- [x] **0.6** Definir e aplicar estrutura de pastas: `core/` (services singleton, guards, interceptors), `shared/` (componentes reutilizáveis), `features/` (uma pasta por feature futura), `layouts/` (público e autenticado) — **🔵 Leandro** e **🟣Rudney**
- [x] **0.7** Sistema de rotas: rotas públicas (login, cadastro, conclusão de cadastro e página da cliente) vs. autenticadas (painel do salão). Guard de auth. Path mapping do `shared/` funcionando (importar DTOs sem `../../../`). — **🔵 Leandro**
- [x] **0.8** Service de autenticação + HttpInterceptor: integra a sessão Clerk, injeta Authorization, trata 401 e materializa/consulta a conta global por `POST /usuarios` e `GET /usuarios/eu`. — **🔵 Leandro**
- [x] **0.9** Layouts (público e autenticado): shell autenticado com header, menu lateral vazio (features vão preencher depois), área com `<router-outlet>`. Layout público sem menu. — **🔵 Leandro**

### Infra

- [ ] **0.10** Pipeline CI (typecheck + build de back e front a cada push) — **livre** (quem terminar primeiro)
- [ ] **0.11** Ambiente staging deployado + deploy automático em merge para `main` — **livre** (quem terminar primeiro)

## Decisões pendentes deste bloco (decidir ANTES de começar, não no meio)

### Backend

- [ ] Hoster de staging (Railway / Render / Fly / outro).
- [ ] Provedores Clerk do MVP: manter e-mail/senha e Google OAuth, ou limitar o cadastro inicial a e-mail/senha?
- [x] Estrutura de pastas em `shared/` (só types? enums? Zod schemas?).

### Frontend

- [x] **UI kit** — Angular Material, PrimeNG, Tailwind + headless, ou CSS puro? Impacta 20+ telas depois; decidir agora evita retrabalho. (Ionic)
- [x] **Standalone components vs. NgModules** — Angular 17+ recomenda standalone; decidir e seguir consistente. (Standalone)
- [x] **Onde guardar o token de auth** — localStorage, sessionStorage, cookie httpOnly? (segurança vs. simplicidade). (Cookie HTTP`Only)
- [x] **State management** — precisa de NgRx/Signals Store agora ou services + Signals são suficientes? (MVP: services + Signals).

## Notas

- A autenticação backend valida Bearer tokens emitidos pelo Clerk. O backend
  não recebe senha nem implementa OAuth; ele expõe `POST /usuarios` para criar
  de forma idempotente a conta global autenticada e `GET /usuarios/eu` para
  consultá-la.

- **0.4** cria o schema Drizzle completo do domínio em `shared/schema/` (todas as ~23 tabelas descritas em [docs/domain/](../domain/)), aplicado ao banco via `npm run db:push`. Motivo da mudança em relação ao plano original: o schema é fonte de verdade compartilhada entre backend e frontend (mono-repo), então gerar tudo de uma vez evita colisão de tabelas entre fatias e mantém `shared/schema/` coerente com o modelo de domínio já documentado. As tabelas nascem sem service/controller — cada fatia futura adiciona o seu módulo Nest sobre a tabela que já existe.
- Depois desta criação inicial, alterações de schema entram como migrations incrementais geradas por `drizzle-kit` (`npm run db:push` em dev; `drizzle-kit generate` + apply para migrations versionadas quando entrar staging/prod).
- **Sequência sugerida no Angular:** 0.5 → 0.6 → 0.7 → 0.8 → 0.9 (uma alimenta a próxima). Podem ir juntas em ~2-3 PRs se forem pequenas; ou uma por PR se preferir revisão fina.
- `GET /usuarios/eu` consulta somente a conta global e não decide se existe salão. A aplicação direciona para a conclusão de cadastro quando receber `404` e para o onboarding quando a conta já existir sem membership.
