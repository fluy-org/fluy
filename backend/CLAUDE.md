# CLAUDE.md — backend

Complementa a raiz. Regras específicas de backend.

## Estrutura de módulo

Cada módulo Nest tem:

- `repository.ts` — Drizzle. CRUD wrappers (`findAll`, `findById`, `create`, etc.).
- `service.ts` — regra de negócio.
- `controller.ts` — HTTP, delega pro service.
- `contracts/` — tipos internos do módulo (ver abaixo).

DTOs, schemas e tabela Drizzle vivem em `shared/schema/{tabela}/`, nunca em `backend/src/`. Backend importa do `@fluy/schema`.

Módulos transversais que não persistem dados nem expõem um recurso HTTP próprio
podem omitir `repository.ts` e `controller.ts`. Eles mantêm `contracts/` e os
providers necessários, como guards e decorators.

## Mappers de resposta

Quando uma feature expõe registro do banco por HTTP, use `{feature}.mapper.ts`:

- É uma função pura que transforma o registro de persistência em resposta HTTP.
- É chamada pelo controller na fronteira HTTP; service retorna dados de persistência e não depende de DTO de resposta.
- Importa o tipo de resposta de `@fluy/schema`, seleciona explicitamente os campos públicos e faz conversões de transporte (ex.: `Date` para ISO).
- Não é provider Nest e não valida o schema em runtime.

## Contracts

Pasta `contracts/` desde o dia 1, mesmo com um arquivo só. Menu fixo:

- `{feature}.enums.ts` — array-enums internos do backend (`as const` + type derivado). Sem Zod.
- `{feature}.types.ts` — tipos que **não** são enum: contextos, params de método privado, retornos de query custom, tipos de infra da feature.
- `index.ts` — barrel. Porta única de import.

Regra: se o type é derivado de um array `as const`, mora no `.enums.ts`. Se não, mora no `.types.ts`.

Enum de domínio (aparece em coluna) mora em `shared/schema/{tabela}/{tabela}.enums.ts` e é importado, não recriado.

## Tipos

Nunca exporte `interface`/`type` de service ou controller. Se for compartilhado dentro da feature, mora em `contracts/`. Se trafega HTTP, mora em `@fluy/schema`.

Nunca usar `enum` nativo do TS em código novo. `as const` + type derivado sempre.

## Assinatura de métodos

≥2 parâmetros = objeto único. 1 param pode ser flat.

```ts
async cadastrarCliente(input: { salaoId: string; nome: string; whatsapp: string }) { ... }
async removerCliente(id: string) { ... }
```

## Nomeação

- Arquivos em `kebab-case`.

## Auxiliares e constantes

- Funções auxiliares fora do arquivo principal → `[feature]-utils.ts`.
- Constantes de configuração → `[feature]-data.ts`.
