# Features de domínio

Cada pasta é uma feature Nest autocontida. As features atuais separam HTTP,
regra de negócio e persistência, e mapeiam a resposta na fronteira HTTP.

## Implementação de referência

`procedimento/` é a feature completa mais representativa: controller
autenticado + controller público, service, repository com transação, validator,
mapper e `contracts/`. Ao implementar algo equivalente, leia-a antes de decidir
estrutura — os padrões abaixo foram extraídos dela e confirmados nas demais.

Para disponibilidade com substituição de coleção, veja `disponibilidade/`.
Para feature transversal sem controller nem repository, veja `auth/`.

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

## Nomes

O domínio é em português e os verbos são consistentes entre as features. Use o
vocabulário existente em vez de criar sinônimo.

**Repository** — o verbo comunica a cardinalidade e o retorno:

| Verbo | Retorno |
|---|---|
| `buscar*` | um registro ou `undefined`; **nunca lança** |
| `listar*` | array, possivelmente vazio |
| `possui*` | `boolean` |
| `criar`, `atualizar`, `desativar` | o registro afetado |
| `substituir*` | troca a coleção inteira do escopo, dentro de transação |
| `remover*` | `void` |

**Service**: mesmos verbos de domínio do repository; quando a ação for
específica do negócio, use o verbo do fluxo (`concluir`, `remarcar`).

**Mapper**: `to{Entidade}Response`. Variante de payload ganha sufixo antes de
`Response` — `toProcedimentoPublicoResponse`, `toUsuarioAtualResponse`.

**Controller**: rota no plural em português (`procedimentos`); método com o
verbo da ação (`criar`, `listar`, `atualizar`, `desativar`).

Declare rota mais específica antes da genérica: `@Delete(':id/imagem')` precisa
vir antes de `@Delete(':id')`.

## HTTP

Controllers de recurso usam `@ApiTags`, `@ApiBearerAuth` quando protegidos,
`@ApiOperation` e decorators de resposta Swagger. Use `*RequestDto` ou
`*QueryDto` no input e `*ResponseDto.Output` para documentar a resposta.

Documente também as respostas de erro possíveis da rota
(`@ApiNotFoundResponse`, `@ApiBadRequestResponse`, `@ApiUnauthorizedResponse`),
como nas rotas existentes.

O pipe Zod global valida body e query estruturalmente. Regras que dependem de
outro campo, dado persistido ou estado de negócio ficam no validator/service.
Use `ParseUUIDPipe` para parâmetros UUID, como nas rotas existentes.

Para o salão autenticado, receba `@TenantFromOwner()`. Para o catálogo público
resolvido pelo host, use `@TenantFromHost()`. Não aceite `salaoId` diretamente
do cliente nesses fluxos.

## Paginação

Listagem que pode crescer sem limite (clientes, histórico) pagina por cursor
opaco. Referência: `cliente/`.

- Query recebe `cursor` opcional; resposta é `{ itens, proximo_cursor }`, com
  `proximo_cursor: null` na última página.
- O tamanho da página é fixo no backend (`{feature}-data.ts`), não vem do
  cliente.
- O repository busca `limite + 1` para saber se há próxima página, sem `COUNT`.
- Hoje o cursor codifica o offset. Quem consome não interpreta o cursor, então
  ele pode passar a carregar a chave de ordenação (keyset) sem mudar o contrato.
- Cursor inválido é `BadRequestException` no service.

Listagem naturalmente limitada, como a agenda do dia, não pagina.

## Persistência

Repositories recebem `Database` com `@InjectDatabase()`. Escritas em múltiplas
tabelas, substituições de coleção ou operações atômicas usam
`database.transaction`.

Services retornam tipos internos para o mapper.

## Erros

**Só service e validator lançam exceção.** Controller e repository não lançam
nenhuma exceção Nest no projeto — o repository devolve `undefined` e é o
service que decide que aquilo é um 404.

Vocabulário em uso:

- `NotFoundException` — registro ausente no escopo do tenant.
- `BadRequestException` — regra de negócio violada. É a mais comum, e o
  validator usa essa.
- `ConflictException` — conflito de unicidade ou de estado já terminal.

Mensagens em português, frase completa terminada em ponto
(`'Procedimento não encontrado.'`).

**Não invente formato de resposta de erro.** `AllExceptionsFilter` é global e já
padroniza o corpo — ver `shared/CLAUDE.md`. Basta lançar a exceção Nest.

Erro de constraint do driver que represente conflito de negócio é traduzido
para exceção Nest no service, pelo código e pelo nome da constraint; há exemplo
em `procedimento.service.ts` e em `salao-onboarding-utils.ts`.

## Validator

Provider injetável com métodos `validar{Acao}`. Lança `BadRequestException`
quando a regra é violada.

Quando o validator também normaliza a entrada, ele **devolve os dados
normalizados** para o service repassar adiante, em vez de mutar o input — é o
que fazem `procedimento`, `disponibilidade`, `salao-configuracao` e `arquivo`.
Validação sem normalização pode retornar `void`, como em `agendamento`.

## contracts/

`contracts/index.ts` é a porta de import da feature.

- `*.enums.ts`: array `as const` e tipo derivado para enum interno sem coluna
  ou schema compartilhado.
- `*.types.ts`: `$inferSelect`, inputs internos, resultados e tipos auxiliares.
- `*-request.dto.ts`, `*-query.dto.ts`, `*-response.dto.ts`: adaptadores Nest
  finos de schemas de `@fluy/schema` via `createZodDto`.

Nomes dos tipos internos:

- `{Entidade}Persistido` / `{Entidade}Persistida` — linha como sai do banco,
  concordando com o gênero do substantivo.
- `{Verbo}{Entidade}Input` — input de método de service.
- `{Verbo}{Entidade}PersistenciaInput` — quando o repository precisa de um
  input diferente do que o service recebeu.

## Testes

Testes unitários vivem em `__tests__/` como `*.spec.ts`, um por arquivo coberto
(`{feature}.service.spec.ts`, `{feature}.validator.spec.ts`). Instancie a
classe sob teste com dependências mockadas e cubra regra e delegação relevante,
sobretudo filtros de tenant e transações de repository.

## Atenção

Pare e reavalie se:

- controller acessa repository ou devolve registro Drizzle;
- controller ou repository lança exceção Nest;
- service retorna DTO HTTP ou expõe tipo interno fora de `contracts/`;
- repository de dado do salão não filtra pelo tenant;
- enum de coluna está sendo recriado na feature;
- um verbo novo está sendo criado para algo que o vocabulário acima já cobre;
- a resposta de erro está sendo montada à mão em vez de vir de uma exceção Nest.
