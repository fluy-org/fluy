# Autenticação

Feature transversal sem controller ou repository. `AuthGuard` é global e
autentica `Authorization: Bearer <token>` pelo token
`AUTHENTICATION_PROVIDER`.

## Uso

- Use `@Public()` somente para rota anônima.
- Use `@CurrentIdentity()` para receber a identidade autenticada no controller.
- Mantenha `AuthenticationProvider`, identidade e perfil em `contracts/`.
- Faça `AuthService` depender do contrato/token, não do provedor concreto.

Clerk e o adaptador de desenvolvimento vivem em `shared/providers/`; a seleção
depende do ambiente validado em `config/env.schema`.

## Atenção

Pare e reavalie se um controller relê o header Authorization, repete a
autenticação ou habilita bypass fora das regras de desenvolvimento.
