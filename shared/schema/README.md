# @fluy/schema

Schema Drizzle compartilhado entre backend e frontend.

## O que vai aqui

- **Definição de tabelas** (`pgTable`) em `src/tables/*.ts`.
- **Tipos inferidos** (`InferSelectModel`, `InferInsertModel`) em `src/types/` ou reexportados de cada tabela.
- **Validadores** com `drizzle-zod` (`createSelectSchema`, `createInsertSchema`) quando útil no front.
- **Enums de banco** (`pgEnum`) e enums TS derivados.

## O que NÃO vai aqui

- Cliente Drizzle (`drizzle()`), pool de conexões, `pg`, `postgres`. Isso é do backend.
- Nada do Nest (`@nestjs/*`), nada de HTTP, nada de RxJS.
- Lógica de negócio.

**Regra**: `dependencies` só pode ter `drizzle-orm`, `drizzle-zod` e `zod`. Se precisar adicionar algo diferente, provavelmente está no pacote errado.

## Estrutura

```
shared/schema/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          ← registro central { salao, cliente, ... }
│   └── tables/
│       ├── salao.ts
│       ├── cliente.ts
│       └── ...
└── dist/                 ← saída do build (gerado por tsc)
```

## Como o backend consome

```ts
import { schema, type Schema } from '@fluy/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(pool, { schema });
```

## Como o frontend consome

```ts
import type { InferSelectModel } from 'drizzle-orm';
import { salao } from '@fluy/schema';

type Salao = InferSelectModel<typeof salao>;
```

Ou, com validação:

```ts
import { salaoSelectSchema } from '@fluy/schema';
type Salao = z.infer<typeof salaoSelectSchema>;
```

## Migrations

Rodadas pelo backend via `drizzle-kit`, que aponta pro schema deste pacote (`shared/schema/src/index.ts`).

Da raiz do mono-repo:

```bash
npm run db:push       # aplica schema no banco (dev)
npm run db:studio     # abre Drizzle Studio
```
