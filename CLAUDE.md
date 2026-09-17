# CLAUDE.md — Fluy

Regras globais do repositório. Regras específicas de backend vivem em `backend/CLAUDE.md`. Contexto/setup do projeto vive no `README.md` e em `docs/`.

## Docs como fonte de verdade

Antes de codar, consulte `docs/`. Não invente regra de negócio que não esteja lá. Ambiguidade encontrada = atualize o `.md` correspondente no mesmo PR.

## Idioma no código

- Domínio em português. Infra/framework em inglês.
- Não misture PT e EN na mesma palavra composta.

## Pacote @fluy/schema

Só pode ter deps de `drizzle-orm`, `drizzle-zod` e `zod`. Nada de `pg`, `postgres`, `@nestjs/*`.

Vive tudo que trafega HTTP entre frontend e backend: tabelas Drizzle, schemas Zod de request/response, DTOs, e enums que aparecem em colunas do banco ou que trafegam HTTP.

### Estrutura por tabela

`shared/schema/{tabela}/`:

- `{tabela}.table.ts` — Drizzle (DDL).
- `{tabela}.constants.ts` — constantes puras reutilizadas por DDL e schemas; não importa Drizzle nem Zod.
- `{tabela}.schema.ts` — schemas Zod (`createInsertSchema`, `createUpdateSchema`, refines).
- `{tabela}.dto.ts` — DTOs via `createZodDto` (consumidos pelo Nest).
- `{tabela}.enums.ts` — array-enums que aparecem em colunas do banco ou que trafegam HTTP.
- `index.ts` — barrel.

### Array-enums (`.enums.ts`)

`as const` + `type` derivado. Sem Zod. Sem dependência interna. É a folha do cone de imports — todo mundo importa dele, ele não importa de ninguém.

```ts
export const STATUS_SALAO = ['ativo', 'inativo', 'suspenso'] as const;
export type StatusSalao = (typeof STATUS_SALAO)[number];
```

A tabela usa como `$type`; o schema Zod deriva com `z.enum(STATUS_SALAO)` quando precisar validar isoladamente.

### Entidade relacionada em schema de response

Quando o response carrega **dois ou mais campos** de uma entidade relacionada, agrupe em objeto aninhado em vez de achatar com prefixo.

```ts
// ✅
cliente: z.object({ id: z.uuid(), nome: z.string() }),

// ❌
cliente_id: z.uuid(),
cliente_nome: z.string(),
```

Campo único derivado do relacionamento vai direto, sem objeto — é o caso de `imagem_url` em `procedimento`.

### Nunca usar `enum` nativo do TS

Em código novo. `as const` + type derivado sempre.

### O que NÃO entra em `shared/`

- Tipos de estado de UI, props de componente, form schemas do frontend.
- Tipos internos de service, contexto de transação, params de método privado do backend.
- Regra: `shared/` só recebe o que **trafega HTTP**. O resto mora na feature que usa.

## Multi-tenant

Toda query de dado pertencente a um salao filtra por `salao_id`. Entidades
globais de identidade, como `usuario` e `identidade_autenticacao`, nao possuem
`salao_id` e sao a excecao explicita a esta regra.

## Fuso horário

Instantes reais, como timestamps e agendamentos, são armazenados em UTC.
Datas e horas civis de disponibilidade (`date` e `time`) são armazenadas e
trafegam no fuso de `salao.fuso_horario`, sem conversão UTC. Exibição e cálculo
de instantes usam helper único (backend) e pipe único (frontend).

## Testes

Automatizado só para regra crítica: guard multi-tenant, cálculo de faturamento, geração de slots, fluxo de pagamento. Resto é teste manual seguindo `docs/flows/*.md`.

## Comentários

- Evite por padrão. Código deve ser autoexplicativo.
- Nunca descreva o "o que". Só o "por quê" (regra de negócio não trivial, decisão arquitetural, workaround).
- Permitido separar blocos semânticos em templates grandes (JSX/HTML de forms complexos), sem excesso.

## Mensagens de commit

- Idioma: português.
- Formato: `tipo(escopo): resumo breve`. Tipos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`.
- Nunca commitar direto. Gere a mensagem, apresente e aguarde aprovação.
- Descreva a mudança pelo efeito no produto, não pela implementação. Nomes de arquivos, funções internas, fixes intermediários não entram.

Exemplo:
```
feat(disponibilidade): adiciona configuração de janela semanal

- cadastra janelas recorrentes por profissional
- suporta overrides por data (fechado ou horários customizados)
```

## Regra final

Se pedirem algo que viole qualquer regra: não execute, avise que viola, sugira a forma correta.
