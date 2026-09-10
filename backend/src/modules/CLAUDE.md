# Features de domínio

Cada pasta é uma feature Nest autocontida. As features atuais separam HTTP,
regra de negócio e persistência, e mapeiam a resposta na fronteira HTTP.

## Nova feature

1. Crie o módulo Nest e registre nele controllers, providers e imports.
2. Separe controller, service e repository quando a feature expuser recurso e
   persistir dados.
3. Crie `contracts/` com `index.ts`, mesmo quando houver pouco conteúdo.
4. Importe o módulo da feature em `AppModule`.

Features transversais, como `auth`, podem não ter controller ou repository.

## Estrutura

- `{feature}.controller.ts`: rota, decorators de autenticação/tenant, DTOs Nest
  e Swagger; delega ao service e mapeia dados persistidos para HTTP.
- `{feature}.service.ts`: regra de negócio, validação de contexto e exceções
  Nest; acessa persistência apenas pelo repository.
- `{feature}.repository.ts`: queries Drizzle, joins, filtros e transações.
- `{feature}.mapper.ts`: função pura que escolhe campos públicos e converte
  transporte, como `Date` para ISO e `numeric` para `number`.
- `{feature}.validator.ts`: provider opcional para regra que envolve múltiplos
  campos ou estado persistido e não cabe no schema Zod.
- `{feature}-utils.ts` e `{feature}-data.ts`: helpers puros e constantes
  próprias, somente quando forem necessários.

## HTTP

Controllers de recurso usam `@ApiTags`, `@ApiBearerAuth` quando protegidos,
`@ApiOperation` e decorators de resposta Swagger. Use `*RequestDto` ou
`*QueryDto` no input e `*ResponseDto.Output` para documentar a resposta.

O pipe Zod global valida body e query estruturalmente. Regras que dependem de
outro campo, dado persistido ou estado de negócio ficam no validator/service.
Use `ParseUUIDPipe` para parâmetros UUID, como nas rotas existentes.

Para o salão autenticado, receba `@TenantFromOwner()`. Para o catálogo público
resolvido pelo host, use `@TenantFromHost()`. Não aceite `salaoId` diretamente
do cliente nesses fluxos.

## Persistência

Repositories recebem `Database` com `@InjectDatabase()`. Escritas em múltiplas
tabelas, substituições de coleção ou operações atômicas usam
`database.transaction`.

Services retornam tipos internos para o mapper e convertem ausência ou conflito
esperado em exceções Nest, como `NotFoundException` e `ConflictException`.

## contracts/

`contracts/index.ts` é a porta de import da feature.

- `*.enums.ts`: array `as const` e tipo derivado para enum interno sem coluna
  ou schema compartilhado.
- `*.types.ts`: `$inferSelect`, inputs internos, resultados e tipos auxiliares.
- `*-request.dto.ts`, `*-query.dto.ts`, `*-response.dto.ts`: adaptadores Nest
  finos de schemas de `@fluy/schema` via `createZodDto`.

## Testes

Testes unitários vivem em `__tests__/` como `*.spec.ts`. Instancie a classe sob
teste com dependências mockadas e cubra regra e delegação relevante, sobretudo
filtros de tenant e transações de repository.

## Atenção

Pare e reavalie se:

- controller acessa repository ou devolve registro Drizzle;
- service retorna DTO HTTP ou expõe tipo interno fora de `contracts/`;
- repository de dado do salão não filtra pelo tenant;
- enum de coluna está sendo recriado na feature.
