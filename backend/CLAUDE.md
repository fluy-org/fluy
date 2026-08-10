# CLAUDE.md — backend

Complementa a raiz. Regras específicas de backend.

## Estrutura de módulo

Cada módulo Nest tem:

- `repository.ts` — Drizzle. CRUD wrappers (`findAll`, `findById`, `create`, etc.).
- `service.ts` — regra de negócio.
- `controller.ts` — HTTP, delega pro service.
- `.types.ts` — tipos compartilhados dentro do módulo.
- `.dto.ts` — DTOs validados via `nestjs-zod`.

Schema Drizzle vive em `shared/schema/src/tables/*.ts`, nunca em `backend/src/`.

## Tipos

Nunca exporte `interface`/`type` de service ou controller. Se for compartilhado, mora em `<modulo>.types.ts`.

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
