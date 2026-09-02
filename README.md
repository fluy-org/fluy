# Fluy

SaaS multi-tenant para salões de beleza. Mono-repo com backend (NestJS), frontend (Ionic + Angular + Capacitor) e schema compartilhado (Drizzle).

## Estrutura

```
fluy/
├── backend/                  NestJS + Drizzle client
├── frontend/                 Ionic + Angular + Capacitor
├── shared/
│   └── schema/               @fluy/schema — pgTable + tipos + drizzle-zod
├── docs/
│   ├── domain/               modelo de domínio
│   ├── features/             capacidades do sistema
│   ├── fluxos/               fluxos de usuário
│   └── processo/             organização do time
├── docker-compose.yml        Postgres
├── package.json              workspaces
├── tsconfig.base.json        TS config comum
└── .env.example
```

## Primeiro setup

```bash
# na raiz
cp .env.example .env
npm install
npm run build:schema
npm run db:up
npm run db:migrate
```

> Banco local criado anteriormente com `db:push` e que precisa preservar dados:
> execute uma única vez `npm run db:adopt-local` antes de `npm run db:migrate`.
> Banco novo deve executar diretamente `npm run db:migrate`.

## Rodar dev

```bash
# terminal 1 — banco (só na primeira vez do dia)
npm run db:up

# terminal 2 — schema em watch (rebuilda quando mudar)
npm run dev:schema

# terminal 3 — backend
npm run dev:back

# terminal 4 — frontend (Ionic + Angular)
npm run dev:front
```

## Comandos úteis (rodar na raiz)

- `npm install` — instala tudo (nunca rodar dentro de backend/ ou shared/).
- `npm install <dep> --workspace=backend` — adiciona dep no backend.
- `npm install <dep> --workspace=@fluy/schema` — adiciona dep no schema.
- `npm run build:schema` — builda o pacote schema (necessário antes do backend consumir).
- `npm run dev:schema` — schema em modo watch (rebuilda ao salvar).
- `npm run db:up` / `db:down` — sobe/desce Postgres.
- `npm run db:generate -- --name <nome>` — gera migration a partir do schema.
- `npm run db:adopt-local` — registra o baseline em banco local legado criado por `db:push`; uso único.
- `npm run db:migrate` — aplica migrations versionadas no banco.
- `npm run db:push` — sincroniza o schema diretamente em banco local descartável; não substitui migration versionada.
- `npm run db:studio` — abre Drizzle Studio.
- `npm run typecheck` — roda tsc --noEmit em todos os workspaces.

## Regra do schema

`@fluy/schema` só depende de `drizzle-orm`, `drizzle-zod` e `zod`. **Não adicionar** `pg`, `postgres`, `@nestjs/*` nesse pacote — vaza pro frontend.

O backend importa `schema` e `Schema` de `@fluy/schema` pra passar ao `drizzle()`. O frontend importa tipos e validadores derivados.

## Documentação

Ver `docs/processo/README.md` para o processo de desenvolvimento (blocos, fatias, alocação por dev).
