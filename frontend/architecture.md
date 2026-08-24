# Arquitetura do frontend

Como o frontend é pensado. Regras curtas ficam no `CLAUDE.md`; aqui está o "porquê" e "como".

## Stack

- **Angular 20** com standalone components. `NgModule` não é usado.
- **Ionic 8** como lib de UI (primitivos vêm de `@ionic/angular/standalone`).
- **Capacitor** para build mobile.
- **Signals** para estado reativo. Sem NgRx.

## Estrutura raiz de `src/app/`

```
src/app/
├── core/           # infra global (roda uma vez)
│   ├── interceptors/
│   ├── guards/
│   ├── providers/
│   └── config/
├── shared/         # código reutilizado por 2+ features
│   ├── components/
│   ├── contracts/
│   ├── directives/
│   ├── pipes/
│   ├── utils/
│   └── kits/
├── features/       # features de domínio
│   └── {feature}/
├── app.component.ts
├── app.component.html
├── app.component.scss
└── app.routes.ts
```

### `core/` vs `shared/`

- **`core/`** — infra singleton global do app. Roda uma vez, não é reutilizável no sentido de "importável de vários lugares". Interceptors HTTP, route guards, providers de bootstrap, config global.
- **`shared/`** — código consumido por 2+ features. Componente reusável, diretiva, pipe, util, kit.

Se você está escrevendo algo que **precisa existir uma única vez no app** (ex.: interceptor de auth), é `core/`. Se você está escrevendo algo que **N features podem importar** (ex.: `<app-empty-state>`), é `shared/`.

### O que vai em `shared/`

- **`components/`** — componentes reutilizáveis por 2+ features. Standalone, presentational, `input()` + `output()` + `OnPush`. Pasta plana: cada componente numa subpasta própria, sem categorização por tamanho ou tipo.
- **`contracts/`** — tipos usados por 2+ features que não trafegam HTTP. Raro; a maioria dos tipos ou está em `@fluy/schema` (trafega) ou na feature (uso único).
- **`directives/`** — comportamento anexado a elemento (ex.: `[appAutoFocus]`, `[appClickOutside]`). Reusa via atributo no template, sem precisar envolver o elemento num wrapper de componente.
- **`pipes/`** — transformações de exibição no template (ex.: `| fusoSalao` pra formatar data no fuso do salão).
- **`utils/`** — funções puras sem side effect.
- **`kits/`** — toolkits fechados: componente + service + tipos + utils agrupados por conceito. Ex.: `form-draft/` (persistência de rascunho em localStorage), `image-cropper/`. Superfície pública controlada via `index.ts`.

## Estrutura da feature

```
features/{feature}/
├── pages/                  # containers de rota
├── components/             # presentational
├── services/               # HTTP + estado
├── contracts/              # tipos internos da feature
├── utils/                  # funções puras (só quando tiver)
└── {feature}.routes.ts
```

Sub-pastas só quando doer. Sem `forms/`, `ui/`, `elements/`, `blocks/`, `views/` até aparecer necessidade concreta.

## Componentes: 2 papéis

- **`pages/{nome}/{nome}.page.ts`** — container. Carregado por rota. Injeta service, faz fetch, orquestra fluxo.
- **`components/{nome}/{nome}.component.ts`** — presentational. `input()` + `output()` + `ChangeDetectionStrategy.OnPush`. Sem `HttpClient` injetado. Recebe dados por input, emite eventos por output.

Como decidir:

1. É carregado por rota? → `pages/`
2. Senão → `components/`

Se um componente de `components/` começa a fazer fetch ou orquestrar navegação, ou (a) devia ser page, ou (b) a lógica devia subir pro container que o usa.

### Por que só 2 papéis

O framework já força boa parte da separação:

- Service é injetado via DI — quem faz HTTP é service, não componente.
- `input()`/`output()` deixa óbvio se é presentational.
- Página carregada por `Router` já é naturalmente o container.
- `OnPush` empurra pra presentational puro.

Ou seja: componente com 17 responsabilidades dói mais rápido no Angular. Sem hierarquia extra.

## Services da feature

- **Um service central por feature** (`{feature}.service.ts`). Auxiliares só quando doer (funções puras vão pra `utils/`; se virar 200 linhas de responsabilidades misturadas, extrai um segundo service).
- **`providedIn: 'root'`** como default — singleton no app inteiro. Mesma instância entre navegações; estado sobrevive quando o usuário sai da tela e volta.
- **Estado dentro do service via signals**. Escrita privada (`_x`), leitura readonly exposta (`x`).

### Convenção de nomes

- **Signal = substantivo** (`agendamentos`, `agendamentoAtual`, `carregando`)
- **Método = verbo** (`carregar`, `criar`, `remover`)

Ambos usam `()` na chamada (`service.agendamentos()`, `service.carregar()`) — o nome distingue leitura de ação.

### Exemplo

```ts
@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private http = inject(HttpClient);

  private _agendamentos = signal<Agendamento[]>([]);
  readonly agendamentos = this._agendamentos.asReadonly();

  readonly agendamentosDoDia = computed(() =>
    this._agendamentos().filter(a => éHoje(a.inicio))
  );

  async carregar(salaoId: string) {
    const dados = await firstValueFrom(
      this.http.get<Agendamento[]>('/agendamentos', { params: { salaoId } })
    );
    this._agendamentos.set(dados);
  }
}
```

### Mutação: update local com retorno do backend

Padrão: mutação atualiza o signal usando o objeto que o backend devolve. Sem refetch.

```ts
async criar(dto: CreateAgendamentoDto) {
  const criado = await firstValueFrom(
    this.http.post<Agendamento>('/agendamentos', dto)
  );
  this._agendamentos.update(lista => [...lista, criado]);
}

async atualizar(id: string, dto: UpdateAgendamentoDto) {
  const atualizado = await firstValueFrom(
    this.http.put<Agendamento>(`/agendamentos/${id}`, dto)
  );
  this._agendamentos.update(lista =>
    lista.map(a => (a.id === atualizado.id ? atualizado : a))
  );
}

async remover(id: string) {
  await firstValueFrom(this.http.delete(`/agendamentos/${id}`));
  this._agendamentos.update(lista => lista.filter(a => a.id !== id));
}
```

**Contrato com o backend**: endpoints de `POST`/`PUT`/`PATCH` devolvem o objeto completo. Se algum endpoint só devolver `{ ok: true }`, cai pra refetch naquela mutação específica.

### Refetch como escape hatch

Refazer `carregar()` só quando:

- Mutação em cascata no backend (ex.: cancelar libera slot da fila, backend promove outro agendamento — o retorno único não expressa a cadeia).
- Filtro/busca/paginação server-side onde replicar em memória é frágil.
- Você não confia no cache local pra aquela mutação específica.

## HTTP: interceptors, sem wrapper

Features usam `HttpClient` direto. Preocupações globais moram em interceptors registrados no bootstrap.

Interceptors iniciais em `core/interceptors/`:

- **`base-url.interceptor.ts`** — prefixa `env.apiUrl` em URLs relativas.
- **`auth.interceptor.ts`** — injeta `Authorization: Bearer …`.
- **`error.interceptor.ts`** — trata erro global (toast, log, redirect em 401).

Adicionar mais quando precisar (`X-Salao-Id`, timezone, retry, etc.). Um interceptor = uma responsabilidade.

### Por que interceptor e não wrapper

- **Composição** — cada interceptor faz uma coisa. Adicionar comportamento = adicionar interceptor.
- **Uniformidade absoluta** — qualquer `HttpClient` no app passa pelos interceptors. Impossível esquecer.
- **Testes mais limpos** — mocka `HttpClient` padrão em vez de wrapper custom.
- **Idiomático Angular** — é o que o framework foi desenhado pra fazer.

## Erros

- **Idiomático Angular**: `throw` + `catchError`. Sem Result Pattern.
- **`errorInterceptor`** cuida do padrão global.
- Feature trata caso específico com try/catch local e re-lança o resto:

```ts
async criar(dto: CreateAgendamentoDto) {
  try {
    const criado = await firstValueFrom(this.http.post<Agendamento>('/agendamentos', dto));
    this._agendamentos.update(lista => [...lista, criado]);
  } catch (err) {
    if (err.status === 409) { /* trata conflito específico */ }
    throw err;
  }
}
```

### Por que não Result Pattern

`HttpClient` já entrega erros num canal separado do dado (`error$` do Observable). `throw` funciona normal em todo lugar, sem risco de perder informação de erro em fronteira alguma. Result Pattern (`Promise<T | ApiError>`) resolveria um problema que não existe aqui e adiciona ruído em toda assinatura.

## Contracts da feature

Pasta `contracts/` desde o dia 1. Menu fixo:

- **`{feature}.enums.ts`** — array-enums de UI internos da feature (`as const` + type derivado). Sem Zod.
- **`{feature}.types.ts`** — tipos que **não** são enum: estado de UI, props internas, tipos intermediários.
- **`index.ts`** — barrel.

Se o type é derivado de um array `as const`, mora no `.enums.ts`. Se não, mora no `.types.ts`.

## Onde mora cada tipo

Pergunta única: **esse tipo descreve algo que trafega HTTP entre front e back?**

- **Sim** → `@fluy/schema` (shared do monorepo). Nunca duplicar.
- **Não, mas 2+ features usam** → `shared/contracts/`.
- **Não, só uma feature usa** → `features/{feature}/contracts/`.

Exemplos que ficam na feature (não trafegam):

- Estado de UI (`type ModalState = 'closed' | 'opening' | 'open' | 'closing'`).
- Props internas de componente.
- Tipos intermediários de form (o que o usuário digita, antes de virar DTO).

## Forms

- `ReactiveFormsModule` como padrão.
- Validação de regras que trafegam HTTP usa `zodValidator` de `shared/utils/zod-validator.ts`, com o schema canônico do `@fluy/schema`. Não duplicar as regras com `Validators` nativos.
- `updateOn` do Reactive Forms define quando validar (`change`, `blur` ou `submit`); `touched` e o estado de envio definem quando exibir o erro.
- Use o schema do campo em cada `FormControl` e o schema completo no `FormGroup`. Assim, validações futuras entre campos continuam cobertas no envio.
- `Validators` nativos do Angular só pra validação puramente de UI que não tem contrato com o backend.

## i18n

Não decidido. Adotar quando aparecer necessidade concreta.
