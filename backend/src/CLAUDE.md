# Código-fonte

`src/` contém o código executável da API. A raiz compõe a aplicação; features
e infraestrutura ficam em subpastas próprias.

## Ponto de entrada

1. `main.ts` cria a aplicação, instala Pino, configura CORS pelo ambiente e
   publica Swagger em `/docs`.
2. `AppModule` importa módulos de feature e infraestrutura.
3. O pipe Zod, `AuthGuard`, `TenantContextGuard` e `ThrottlerGuard` são globais.

Rotas são autenticadas por padrão. Use `@Public()` apenas quando a rota for
realmente anônima.

## Organização

- `modules/`: regra de negócio e HTTP.
- `shared/`: infraestrutura reutilizável sem recurso HTTP próprio.
- `config/` e `database/`: configuração e acesso ao banco pelos providers
  existentes.
- `__tests__/`: testes unitários co-localizados com o código coberto.

## Atenção

Pare e reavalie se:

- um provider de feature está sendo adicionado diretamente a `AppModule`;
- uma feature cria conexão/configuração própria em vez de consumir o provider;
- uma rota está sendo exposta sem considerar os guards globais.
