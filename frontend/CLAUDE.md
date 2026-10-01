# CLAUDE.md — frontend

Complementa a raiz. Regras específicas de frontend. Contexto e "porquê" vivem em `architecture.md`.

## Implementação de referência

O frontend é menos padronizado que o backend. Antes de criar estrutura nova,
olhe o que já existe e siga:

- `features/salao/disponibilidade/` — feature mais completa: `pages/`,
  `services/`, `contracts/` e constantes próprias.
- `features/salao/procedimentos/` — page + componente apresentacional +
  service, incluindo o upload de imagem.
- `features/auth/` — integração com o Clerk e uso de `core/`.

Nenhuma feature tem hoje a estrutura completa descrita abaixo. Ausência de uma
pasta significa que ainda não foi necessária — não que a regra mudou.

## Standalone e signals

- Nada de `NgModule` em código novo. Standalone sempre.
- Signals para estado. Sem NgRx.

## Estrutura de `src/app/`

Três pastas na raiz do `app/`: `core/`, `shared/`, `features/`.

- `core/` — infra global (interceptors, guards, providers, config). Roda uma vez.
- `shared/` — reusado por 2+ features (`components/`, `contracts/`, `directives/`, `pipes/`, `utils/`, `kits/`).
- `features/{feature}/` — features de domínio.

## Estrutura da feature

```
features/{feature}/
├── pages/
├── components/
├── services/
├── contracts/
├── utils/                  # só quando tiver
└── {feature}.routes.ts
```

Sem `forms/`, `ui/`, `elements/`, `blocks/`, `views/` até doer.

## Componentes: 2 papéis

- `pages/{nome}/{nome}.page.ts` — container. Carregado por rota. Injeta service, faz fetch, orquestra.
- `components/{nome}/{nome}.component.ts` — presentational. `input()` + `output()` + `ChangeDetectionStrategy.OnPush`. Sem `HttpClient` injetado.

Se um componente de `components/` começa a fazer fetch ou orquestrar navegação, sobe pra page.

**Exceção — bloco embutível:** quando 2+ pages precisam da mesma orquestração
(fetch + mutation + modal) só com escopo diferente, ela vira um componente que
injeta os services e recebe o escopo por `input()`, em vez de ser duplicada nas
pages. A page que embute só passa o escopo e ouve `output()` para o que for
dela. Cada bloco cuida de uma entidade e mora na feature dela. Referência:
`features/salao/notas/components/secao-notas/` e
`features/salao/lembretes/components/secao-lembretes/`, usados pela ficha da
cliente e pelo detalhe do agendamento.

### Componentes de UI
- Prefira componentes do Ionic sempre que existir um equivalente adequado. Use,
  por exemplo, `ion-button`, `ion-input`, `ion-checkbox`, `ion-list`, `ion-item`,
  `ion-card` e `ion-text` em vez de recriar esses elementos com HTML puro.
- Para textos simples exibidos na interface, prefira `ion-text` a elementos como
  `<p>` e `<span>`. HTML nativo continua permitido quando não houver equivalente
  Ionic ou quando for necessário para estrutura, semântica e acessibilidade,
  como `div`, `main`, `section`, `header`, `form`, títulos e labels.
- Não substitua uma tag semântica por um componente Ionic se isso empobrecer a
  hierarquia do documento ou a experiência de tecnologias assistivas.
- **Exceção:** Além dos componentes do Ionic, o projeto pode utilizar um conjunto de componentes customizados com prefixo `app-*` (ex: `app-input-text`, `app-btn-salvar`) para agilizar o desenvolvimento de formulários e ações.

## Services

- Um service central por feature (`{feature}.service.ts`). Auxiliares só quando doer.
- `providedIn: 'root'` como default.
- Estado dentro do service via signals. Escrita privada (`_x`), leitura readonly (`x`).
- Signal = substantivo. Método = verbo.
- Services de CRUD usam os nomes `getLista`, `getEntidade`, `setEntidade`,
  `updateEntidade` e `deleteEntidade`. Services que nao representam CRUD usam
  nomes de acao do dominio.

## Mutação: update local com retorno do backend

Padrão: `.update()` do signal usando o objeto que o backend devolve.

- `POST` → backend devolve criado → `update(lista => [...lista, criado])`
- `PUT`/`PATCH` → backend devolve atualizado → `update(lista => lista.map(a => a.id === atualizado.id ? atualizado : a))`
- `DELETE` → `update(lista => lista.filter(a => a.id !== id))`

Refetch (`carregar()`) só como escape hatch: mutação em cascata no backend, filtro/paginação server-side complexos, ou desconfiança do cache local.

Endpoints de `POST`/`PUT`/`PATCH` devem devolver o objeto completo. Se um endpoint só devolver `{ ok: true }`, cai pra refetch naquela mutação.

## Paginação

Listas paginadas pelo backend (cursor opaco, ver `backend/src/modules/CLAUDE.md`)
seguem `features/salao/clientes/`:

- O service guarda itens e `proximo_cursor` em signals; trocar filtro ou busca
  refaz a primeira página, e a próxima página acumula descartando ids repetidos.
- A page usa `ion-infinite-scroll`, desabilitado quando `proximo_cursor` é
  `null`.
- Busca e filtro são server-side; não filtre em memória o que não foi
  carregado.

## HTTP

- Features usam `HttpClient` direto. Sem wrapper `ApiService`.
- Preocupações globais em `core/interceptors/`: `base-url`, `auth`, `error`. Um interceptor = uma responsabilidade.
- `HttpClient` só é injetado em service. Nunca em componente.

## Erros

- `throw` + `catchError`. Sem Result Pattern.
- Interceptor global cuida do padrão. Feature trata caso específico com try/catch local e re-lança o resto.

## Contracts da feature

Pasta `contracts/` desde o dia 1. Menu fixo:

- `{feature}.enums.ts` — array-enums internos (`as const` + type derivado). Sem Zod.
- `{feature}.types.ts` — tipos que não são enum: estado de UI, props internas, tipos intermediários.
- `index.ts` — barrel.

Se o type é derivado de array `as const` → `.enums.ts`. Senão → `.types.ts`.

Nunca `enum` nativo do TS em código novo.

## Onde mora cada tipo

Pergunta única: **trafega HTTP entre front e back?**

- Sim → `@fluy/schema` (shared do monorepo). Nunca duplicar.
- Não, 2+ features usam → `shared/contracts/`.
- Não, uma feature usa → `features/{feature}/contracts/`.

## Forms

- `ReactiveFormsModule` como padrão.
- Regras que trafegam HTTP usam `zodValidator` de `shared/utils/zod-validator.ts` com o schema de `@fluy/schema`; não duplicar com `Validators` nativos.
- `updateOn` define quando validar; `touched` e o estado de envio definem quando exibir o erro.
- `Validators` nativos só pra validação puramente de UI sem contrato com backend.

## Nomeação

- Funções e métodos com dois ou mais argumentos recebem um objeto de input; um
  único argumento pode ser parâmetro direto. Mesma regra do backend.
- Arquivos em `kebab-case`.
- Componente: `{nome}.component.ts`. Página: `{nome}.page.ts`. Service: `{nome}.service.ts`.
- Imports internos de `src/app` usam o alias `@app/*`. Não use caminhos
  relativos ascendentes como `../` ou `../../`; por exemplo, prefira
  `@app/features/pagina-cliente/services/pagina-cliente.service`.
- Imports relativos com `./` ficam permitidos apenas para arquivos irmãos muito
  próximos quando o alias não tornar a origem mais clara.

## Auxiliares e constantes

- Funções auxiliares fora do arquivo principal → `[feature]-utils.ts`.
- Constantes de configuração → `[feature]-data.ts`.

## Anti-padrões

- ❌ `NgModule` em código novo.
- ❌ `enum` nativo do TS.
- ❌ Result Pattern.
- ❌ Herança de `BaseService`.
- ❌ Wrapper `ApiService` envolvendo `HttpClient`.
- ❌ Duplicar tipo que trafega HTTP no frontend.
- ❌ `interface`/`type` exportado direto de service ou componente.
- ❌ Fetch, mutation ou orquestração ativa em componente de `components/` (salvo o bloco embutível descrito em "Componentes").
- ❌ Signal escrito de fora do service.
- ❌ `HttpClient` injetado em componente.
- ❌ Refetch como padrão após mutação.
