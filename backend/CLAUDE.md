# Backend

API NestJS/TypeScript com PostgreSQL via Drizzle e contratos HTTP definidos em
`@fluy/schema`. Complementa o `CLAUDE.md` da raiz.

## Navegação

- `src/main.ts`: CORS, logging e Swagger em `/docs`.
- `src/app.module.ts`: composição dos módulos e guards/pipes globais.
- `src/config/`: validação e leitura do ambiente.
- `src/database/`: cliente Drizzle tipado.
- `src/modules/`: features de domínio e rotas HTTP.
- `src/shared/`: infraestrutura transversal.
- `drizzle/`: migrações SQL e metadados do Drizzle Kit.

Leia o `CLAUDE.md` da subpasta antes de alterar uma dessas áreas.

## Contratos

`@fluy/schema` é a fonte de tabelas Drizzle, schemas Zod, tipos de request e
response e enums persistidos. O backend consome esse pacote; não recrie schema
HTTP ou tabela em `src/`.

As classes Nest que adaptam schemas para pipes e Swagger ficam em
`contracts/` da feature e apenas usam `createZodDto`. Tipos de persistência,
inputs internos e integrações também vivem ali e não são expostos pela API.

## Regras

- Use `@/` para imports a partir de `src/`.
- Use arquivos em `kebab-case` e `as const` com tipo derivado para enums novos.
- Métodos com dois ou mais argumentos recebem um objeto de input; um único
  identificador simples pode ser parâmetro direto.
- Mappers convertem persistência para HTTP. Controller não retorna registro
  Drizzle e service não depende de DTO de resposta.
- Dados do salão recebem `salaoId` até o repository, que filtra a query. As
  entidades globais de identidade são a exceção definida na raiz.

## Verificação

```bash
npm run typecheck
npm test -- <arquivo-afetado>
```

Use `npm run lint`, `npm run build` e `npm run test:e2e` quando o escopo pedir.
Para schema, use os scripts `db:*` e consulte `drizzle/CLAUDE.md`.

## Atenção

Pare e reavalie se:

- a mudança duplica um contrato de `@fluy/schema`;
- uma query de entidade do salão não recebe/faz filtro por `salaoId`;
- a alteração exige modificar uma migração já aplicada.
