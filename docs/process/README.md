# Processo de desenvolvimento — Fluy

Documentação de "como trabalhamos", separada de `domain/`, `features/`, `fluxos/` (que descrevem "o que é o produto").

## Time

- **🔵 Leandro** — mais forte em Angular.
- **🟣 Rudney** — mais forte em Nest.

Regra deliberada: a alocação alterna as stacks. Ninguém "vira" o dev do backend ou do frontend. Cada fatia é fullstack (backend + frontend juntos no mesmo PR).

## Onboarding

- [Setup inicial](./setup-inicial.md) — do zero: clone, `npm install`, subir back, criar Angular.

## Blocos

- [Bloco 0 — Fundação](./bloco-0-fundacao.md)
- [Bloco 1 — Setup do salão](./bloco-1-setup-salao.md)
- [Bloco 2 — Motor operacional](./bloco-2-motor.md)
- [Bloco 3 — Operação e financeiro](./bloco-3-operacao-financeiro.md)
- [Bloco 4 — Cliente final](./bloco-4-cliente-final.md)
- [Bloco 5 — Pagamento online](./bloco-5-pagamento.md)

## Como usar

- Cada bloco é um `.md` com as fatias em checkbox.
- Ao pegar uma fatia, avise no chat qual vai puxar (evita duplicar).
- Ao concluir, marca `[x]` e faz merge do PR.
- Se travar em decisão, marca `[BLOQ]` ao lado e mensagem no chat.
- Ambiguidades pequenas (marcadas `[DECIDIR:]`): resolve em conversa curta, atualiza o `.md` do fluxo no mesmo PR.

## Legenda

- `[ ]` — pendente
- `[x]` — concluída (PR mergeado + deploy em staging + outro dev conseguiu executar)
- `⚡` no início da linha — em andamento agora
- `[DEP: X.Y](...)` — depende da fatia X.Y; clique no selo para abrir a fatia correspondente
- `[SEED-OK]` — pode ser feita isoladamente com seed manual, mesmo sem a dependência
- `[BLOQ:xxx]` — bloqueada por decisão externa (gateway, LGPD, etc.)
- `[DECIDIR: xxx]` — tem uma ambiguidade a resolver antes/durante

## Regra de alocação (não é lei)

- Alternar stacks. Se puxou uma fatia que é mais Angular, próxima puxa uma mais Nest.
- Fatias fullstack (a maioria) não têm essa distinção — livre.
- Fatias marcadas "par obrigatório" fazem juntos (2.2 é o único caso).

## Definição de "pronto" (DoD)

Uma fatia é `[x]` quando:

1. PR mergeado em `main`.
2. Deploy em staging passou.
3. O outro dev conseguiu executar o fluxo em staging seguindo o `fluxos/*.md` correspondente.

## Ambiente de trabalho

- **IDE:** Visual Studio 2022 ou 2026 tem atrito real com mono-repo Node + Angular + NestJS (sem template NestJS, sem multi-root workspace nativo, Solution Explorer não entende npm workspaces). Se optarem por manter, provavelmente vão usar terminal integrado a maior parte do tempo. Alternativa recomendada para esse projeto: **VS Code** (mesmo Windows, grátis, ecossistema Nest/Angular nativo).
- **Banco local:** Postgres via Docker. ORM = Drizzle. Alterações persistentes de schema exigem migration versionada gerada por `drizzle-kit`; `npm run db:migrate` a aplica. `drizzle-kit push` fica restrito a banco local descartável e não substitui a migration.
- **Contrato back↔front:** schema Drizzle vive em `shared/schema/` (pacote `@fluy/schema`). Renomeou coluna? TypeScript grita nos dois lados. Regra: `@fluy/schema` só pode ter deps de `drizzle-orm`, `drizzle-zod`, `zod` — nada de `pg`, `@nestjs/*`, senão vaza pro front.
