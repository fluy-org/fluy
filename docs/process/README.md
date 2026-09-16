# Processo de desenvolvimento — Fluy

Documentação de "como trabalhamos", separada de `domain/`, `features/`, `fluxos/` (que descrevem "o que é o produto").

## Time

- **🔵 Leandro** — mais forte em Angular.
- **🟣 Rudney** — mais forte em Nest.

Regra deliberada: ninguém "vira" o dev do backend ou do frontend. Do Bloco 3 em
diante, cada bloco é uma **feature vertical completa com dono único** — backend,
frontend e teste da mesma feature ficam com a mesma pessoa. Como cada bloco tem
as duas stacks dentro, a alternância acontece dentro do próprio bloco, não entre
fatias. Ver [Reorganização a partir do Bloco 3](#reorganização-a-partir-do-bloco-3).

## Onboarding

- [Setup inicial](./setup-inicial.md) — do zero: clone, `npm install`, subir back, criar Angular.

## Blocos

- [Bloco 0 — Fundação](./bloco-0-fundacao.md) — ✅ concluído (0.10 CI e 0.11 staging adiados por decisão do time)
- [Bloco 1 — Setup do salão](./bloco-1-setup-salao.md) — ✅ concluído
- [Bloco 2 — Motor de agendamento e agendamento manual](./bloco-2-motor.md) — em andamento
- [Bloco 3 — Operação do agendamento no painel](./bloco-3-painel-operacao.md) — 🟣 Rudney
- [Bloco 4 — Cliente final (página pública)](./bloco-4-cliente-final.md) — 🔵 Leandro
- [Bloco 5 — Ficha da cliente, histórico e lembretes](./bloco-5-ficha-cliente.md) — 🟣 Rudney
- [Bloco 6 — Notificações e tempo real](./bloco-6-notificacoes.md) — 🔵 Leandro
- [Bloco 7 — Faturamento](./bloco-7-faturamento.md) — 🟣 Rudney
- [Bloco 8 — Anexos em agendamento](./bloco-8-anexos-agendamento.md) — 🔵 Leandro
- [Bloco 9 — Pagamento online](./bloco-9-pagamento-online.md) — dividido por superfície, `[BLOQ:gateway]`

## Reorganização a partir do Bloco 3

Os blocos 0, 1 e 2 foram planejados com **fatias pequenas divididas entre os
dois devs dentro da mesma feature**. Funcionou para destravar o começo, mas
produziu bloqueio constante: uma tela esperando um endpoint, um endpoint
esperando uma entity, dois PRs no mesmo arquivo, e ninguém conseguindo testar
uma feature inteira sozinho.

**Do Bloco 3 em diante a unidade de trabalho muda: um bloco = uma feature
vertical completa, com dono único.**

Regras da nova divisão:

1. **Dono único por bloco.** Backend, frontend e teste da mesma feature ficam com a mesma pessoa. Não existe mais "fatia BE" e "fatia FE" da mesma coisa.
2. **Cada bloco é testável sozinho.** Ao fechar um bloco, o dono roda o fluxo correspondente em `flows/*.md` de ponta a ponta sem depender de trabalho em curso da outra pessoa.
3. **Blocos andam em pares paralelos.** 3 ‖ 4, depois 5 ‖ 6, depois 7 ‖ 8. Dentro de um par não existe dependência.
4. **Dependência só entre pares, nunca dentro.** Um bloco só depende de coisa já mergeada. A única exceção documentada é [2.1](./bloco-2-motor.md#21-clientes), que o Bloco 4 espera — e é a primeira fatia do próprio dono do Bloco 4.
5. **Feature transversal vira bloco próprio e espera.** Notificações e anexos de agendamento tocam as duas superfícies; em vez de fatiar entre os dois devs, a feature inteira é adiada para depois que as duas superfícies existirem e entregue de uma vez, por uma pessoa.
6. **Quem é dono da superfície continua dono dela.** O painel operacional é do 🟣 Rudney; a página pública da cliente é do 🔵 Leandro. Isso vale inclusive no Bloco 9.

### Mapa de paralelismo

```
agora    │ 🟣 Bloco 3 — painel operacional   ‖  🔵 Bloco 2 (2.1 → 2.2c) → Bloco 4 — cliente final
depois   │ 🟣 Bloco 5 — ficha e lembretes    ‖  🔵 Bloco 6 — notificações e tempo real
depois   │ 🟣 Bloco 7 — faturamento          ‖  🔵 Bloco 8 — anexos em agendamento
por fim  │ 🟣 9.1 gateway → 9.3              ‖  🔵 9.2, 9.4, 9.5        [BLOQ:gateway]
```

### De onde veio cada fatia antiga

| Plano antigo | Agora |
|---|---|
| 2.3 agenda do dia | [3.1](./bloco-3-painel-operacao.md#31-agenda-do-dia-e-detalhe-do-agendamento) |
| 2.4 conclusao | [3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual) |
| 2.5 no-show + 2.6 cancelamento | [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) (juntas) |
| 2.7 remarcacao | [3.4](./bloco-3-painel-operacao.md#34-remarcação) |
| 2.8 historico de clientes | [5.1](./bloco-5-ficha-cliente.md#51-lista-e-ficha-da-cliente) |
| 2.9 anexos em agendamento | [Bloco 8](./bloco-8-anexos-agendamento.md) (virou bloco) |
| 3.1 lembretes | [5.2](./bloco-5-ficha-cliente.md#52-notas-e-lembretes) |
| 3.2 faturamento | [Bloco 7](./bloco-7-faturamento.md) (virou bloco) |
| 4.1 primeiro acesso + 4.2 retorno | [4.1](./bloco-4-cliente-final.md#41-acesso-público-e-identificação-da-cliente) (juntas) |
| 4.3 criacao pela cliente | [4.2](./bloco-4-cliente-final.md#42-criação-de-agendamento-pela-cliente) |
| 4.4 cancelamento pela cliente | [4.3](./bloco-4-cliente-final.md#43-meus-agendamentos-e-cancelamento) |
| 4.5 notificacoes | [Bloco 6](./bloco-6-notificacoes.md) (virou bloco) |
| 5.1 modulo de pagamento | [9.1](./bloco-9-pagamento-online.md#91-módulo-de-pagamento-e-estado-reservado) |
| 5.2 sinal | [9.2](./bloco-9-pagamento-online.md#92-sinal-e-checkout-no-fluxo-da-cliente) |
| 5.3 reembolso | [9.3](./bloco-9-pagamento-online.md#93-reembolso-no-cancelamento) |
| 5.4 cobranca do restante | [9.4](./bloco-9-pagamento-online.md#94-cobranças-online-pelo-painel) |

## Anatomia de uma fatia

Do Bloco 3 em diante, cada fatia é o insumo direto do
[prompt de planejamento de feature](../prompts/planejamento-feature.md): cola a
entrada da fatia lá e o planejamento começa com o escopo já fechado.

Por isso toda fatia traz:

- **A linha de checkbox** — resumo, dono, `[DEP:]`, `[BLOQ:]`, `[DECIDIR:]`. É a parte que vai para o prompt.
- **O que deve existir** — tudo que precisa estar de pé, separado por backend / frontend / shared schema. É "o quê", não "como": nada de nome de arquivo, assinatura de método ou decisão de implementação.
- **Fora desta fatia** — o que parece pertencer mas não é, com link para onde foi. Evita escopo crescendo em silêncio.
- **Decisões que precisam estar fechadas antes** — as `[DECIDIR:]` e as pendências de [PENDENCIAS.md](../flows/PENDENCIAS.md) que travam a fatia.
- **Critério de conclusão** — qual fluxo de `flows/*.md` roda ponta a ponta quando ela fecha.
- **Tamanho estimado** — em arquivos alterados.

### Tamanho de fatia

A régua vem do repo: a fatia do motor
([2.2b](./bloco-2-motor.md#22b-motor-de-agendamento)) saiu com **43 arquivos e
4.235 linhas, e era só backend**. Uma fatia fullstack aqui fica entre **50 e
100 arquivos**.

Fatia muito menor que isso vira ruído de PR e fragmenta a feature; muito maior
vira revisão impossível. Quando o corte natural de um fluxo dava algo pequeno
demais, duas foram juntadas — no-show com cancelamento, notas com lembretes,
lista com ficha da cliente. Está registrado no "por que juntas" de cada uma.

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

- **Bloco inteiro, um dono.** Quem puxa o bloco entrega backend, frontend e teste dele.
- Não pegar fatia do bloco do outro para "adiantar". Se sobrou tempo, abrir o próximo bloco da sua coluna no [mapa de paralelismo](#mapa-de-paralelismo).
- Se um bloco passar de ~2 semanas, revisar o corte — não redistribuir fatias no meio.
- **Code review é sempre cross-stack e cross-bloco.** É o que mantém os dois conhecendo o produto inteiro e impede que cada um vire dono permanente de uma superfície.

## Definição de "pronto" (DoD)

**CI (0.10) e staging (0.11) ficam adiados por decisão do time.** Enquanto não
existirem, a validação é local e o DoD é este:

Uma fatia é `[x]` quando:

1. `npm run typecheck` e os testes passam localmente.
2. PR mergeado em `main`.
3. O outro dev subiu a `main` no ambiente dele e executou o fluxo correspondente em `flows/*.md`.

Um **bloco** é `[x]` quando todas as suas fatias estão `[x]` e o dono rodou o
fluxo completo correspondente em `flows/*.md` de ponta a ponta — sem seed
manual e sem depender de trabalho em curso da outra pessoa. É esse critério
que torna cada bloco candidato natural a um teste e2e (Cypress) do fluxo.

> **O que isso custa.** Sem CI, quebra de build só aparece quando o outro puxa a
> `main` — daí o item 1 ser obrigatório antes do merge. Sem staging, o item 3
> depende de o outro dev subir o projeto localmente, então vale combinar seed
> reproduzível (`db:push` + script de seed) junto com cada bloco.
>
> Reavaliar antes do [Bloco 9](./bloco-9-pagamento-online.md): webhook de
> gateway precisa de URL pública, e aí staging deixa de ser opcional.

## Ambiente de trabalho

- **IDE:** Visual Studio 2022 ou 2026 tem atrito real com mono-repo Node + Angular + NestJS (sem template NestJS, sem multi-root workspace nativo, Solution Explorer não entende npm workspaces). Se optarem por manter, provavelmente vão usar terminal integrado a maior parte do tempo. Alternativa recomendada para esse projeto: **VS Code** (mesmo Windows, grátis, ecossistema Nest/Angular nativo).
- **Banco local:** Postgres via Docker. ORM = Drizzle. Alterações persistentes de schema exigem migration versionada gerada por `drizzle-kit`; `npm run db:migrate` a aplica. `drizzle-kit push` fica restrito a banco local descartável e não substitui a migration.
- **Contrato back↔front:** schema Drizzle vive em `shared/schema/` (pacote `@fluy/schema`). Renomeou coluna? TypeScript grita nos dois lados. Regra: `@fluy/schema` só pode ter deps de `drizzle-orm`, `drizzle-zod`, `zod` — nada de `pg`, `@nestjs/*`, senão vaza pro front.
