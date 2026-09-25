# Contexto de tenant

O componente resolve o salão da requisição e armazena o resultado em
`request.tenantContext`. Seu guard é global.

## Uso

- `@TenantFromOwner()` resolve o salão da identidade dona em endpoint
  autenticado. `AuthGuard` executa antes.
- `@TenantFromHost()` resolve o salão pelo subdomínio do `Host` em endpoint
  público e também marca o handler como público.

Os decorators são parâmetros de controller e fornecem o metadado interpretado
pelo guard. O resolver busca por dono ou host via `TenantContextRepository`; se
não houver salão, o guard retorna 404.

- `@TenantFromPath()` resolve o salão pelo parâmetro `:subdominio` em endpoint
  público do MVP e também marca o handler como público.

## Fluxo

1. Receba `TenantContext` pelo decorator.
2. Passe `tenant.salaoId` ao service.
3. Faça o repository aplicar esse escopo à query.

Tipos e valores do contrato ficam em `contracts/`, reexportados por `index.ts`.

## Atenção

Pare e reavalie se algum fluxo monta `TenantContext`, altera a request ou aceita
o identificador do salão diretamente do cliente.
