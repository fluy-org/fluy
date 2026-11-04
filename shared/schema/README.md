# @fluy/schema

Fonte compartilhada das tabelas Drizzle, schemas Zod, tipos HTTP e enums persistidos ou transportados entre frontend e backend. As regras canônicas estão no [CLAUDE.md da raiz](../../CLAUDE.md).

## Conteúdo e estrutura

Cada tabela tem uma pasta em `src/{tabela}/`, com arquivos `*.table.ts`, `*.schema.ts`, `*.dto.ts`, `*.enums.ts`, constantes puras quando necessárias e `index.ts`. Os DTOs compartilhados são tipos inferidos de Zod; classes Nest com `createZodDto` ficam em `contracts/` da feature backend.

Array-enums usam `as const` e tipo derivado, sem imports internos, Drizzle ou Zod. Tabelas usam os tipos derivados; schemas usam `z.enum` quando necessário. Não criar enums nativos de TypeScript.

## Dependências e limites

Somente `drizzle-orm`, `drizzle-zod` e `zod` em dependencies. Não incluir cliente de banco, pool, `pg`, `postgres`, Nest, RxJS, estado de UI, inputs internos de services ou regras de negócio.

## Consumo

O backend importa `schema`, `Schema`, tabelas e contratos de `@fluy/schema`. O frontend importa contratos HTTP e validadores do mesmo pacote, sem duplicá-los. Execute `npm run build:schema` na raiz antes de consumir alterações.

## Migrações

O Drizzle Kit do backend aponta para `shared/schema/src/index.ts`. Depois de alterar DDL, execute na raiz `npm run db:generate` e `npm run db:migrate`. `db:push` é restrito a banco local descartável e não substitui migração versionada. Não alterar migrações já aplicadas; veja [backend/drizzle/CLAUDE.md](../../backend/drizzle/CLAUDE.md).
