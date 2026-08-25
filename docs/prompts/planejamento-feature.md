

# Planejamento de Feature — Fluy

A seguir vou descrever a fatia/feature que quero implementar.

- [ ] **1.2-BACKEND** Login — endpoint `GET /usuarios/eu` (retorna estado: sem-cadastro, sem-salao, com-salao) pra o frontend decidir pra onde redirecionar depois do Clerk criar sessão. — `[DEP: 1.0]`


## Contexto do repositório

Este é um mono-repo do projeto **Fluy** (SaaS multi-tenant para salões de beleza, NestJS + Angular + Drizzle).

A documentação oficial vive em:

- `docs/domain/` — modelo de domínio (entidades, relacionamentos, regras).
- `docs/features/` — capacidades do sistema, agrupamento de fluxos.
- `docs/fluxos/` — fluxos de usuário detalhados. **Fonte oficial de regras de negócio.**
- `docs/fluxos/PENDENCIAS.md` — decisões adiadas do projeto.
- `docs/processo/` — organização do trabalho (blocos, fatias, setup).
- `CLAUDE.md` — instruções específicas (na raiz e em pastas, quando existir).

### Leitura obrigatória (sempre)

Antes de qualquer coisa, leia:

1. A entrada da fatia no bloco correspondente em `docs/processo/bloco-N-*.md`. Ali estão dependências, bloqueios, decisões pendentes e observações da fatia.
2. `CLAUDE.md` da raiz (se existir).

Isso é o mínimo pra você saber do que se trata e não fazer suposições cegas.

### Leitura sob demanda (avaliada pela fatia)

Depois da leitura obrigatória, decida o que mais é **relevante para esta fatia específica**. Alguns exemplos:

- Se a fatia toca uma entidade → ler `docs/domain/<entidade>.md`.
- Se a fatia implementa um fluxo → ler o `docs/fluxos/<ator>/<fluxo>.md` correspondente + a feature em `docs/features/`.
- Se a fatia lista `[BLOQ:xxx]` ou `[DECIDIR:xxx]` → ler a entrada correspondente em `PENDENCIAS.md`.
- Se a fatia altera código existente → ler o(s) arquivo(s) que vão ser tocados.
- Se a fatia é puramente técnica (infra, setup, config, refactor sem mudar comportamento) → provavelmente **não precisa** ler `domain/` ou `fluxos/`. Justifique.

**Não leia por leitura.** Se um doc não vai influenciar nenhuma decisão desta fatia, não leia.

## Regras

* Não escreva código.
* Não implemente nada.
* Não invente regras de negócio — se não está em `docs/fluxos/*` ou `docs/domain/*`, pergunte.
* Não assuma comportamentos.
* Não contradiga nem redefina decisões já estabelecidas nos docs.
* Reutilize tudo o que já existir no contexto e no código.
* Questione qualquer ambiguidade antes de continuar.
* Faça apenas uma pergunta por vez.
* Sempre prefira soluções simples e avise caso encontre alguma forma de reduzir a complexidade da fatia.
* Ao encontrar decisão em aberto marcada em `PENDENCIAS.md`, `[DECIDIR:]` no bloco, ou "Dúvidas em aberto" nos fluxos: **pare e me consulte**.

## Processo

### 1. Leitura e ancoragem

Faça a leitura obrigatória. Depois, **antes de ler mais qualquer coisa**, me responda:

1. Resumo em 1-2 linhas do que a fatia pede (com base no bloco).
2. Lista dos arquivos que você pretende ler além do mínimo, com justificativa curta de cada um.
3. Lista dos arquivos que você conscientemente vai **pular** e por quê (só menciona os que seriam candidatos óbvios mas não fazem sentido pra esta fatia).
4. Se houver algo do mínimo obrigatório que não existe ou está incompleto, avise.

Espere minha confirmação antes de ler os arquivos adicionais. Eu posso:
- Aprovar sua lista.
- Cortar leitura desnecessária.
- Adicionar algo que você não previu.

Só depois de aprovada a lista, siga pro Entendimento.

### 2. Entendimento

Resuma:

* Objetivo (com base nos docs, não inventado)
* Problema que resolve
* Como se encaixa no sistema (quais entidades do domínio toca, quais fluxos executa)
* Dependências e impactos conhecidos, incluindo fatias já concluídas ou pendentes do mesmo bloco
* Pendências de `PENDENCIAS.md` que impactam
* Ambiguidades ou dúvidas em aberto encontradas na leitura

### 3. Descoberta

Conduza a conversa identificando todas as decisões ainda necessárias antes da implementação.

Considere principalmente:

* Fluxo do usuário (confrontando com o `docs/fluxos/*.md` correspondente)
* Regras de negócio (idem)
* Estados e transições (ver `docs/domain/*.md`)
* Validações
* Casos de borda (comparar com "Casos extremos" dos fluxos)
* Permissões / multi-tenant (guard de `salao_id`)
* Impactos em outras fatias do bloco ou em fatias futuras
* Regras de fuso horário / normalização (whatsapp, datas em UTC)

Nunca invente respostas. Sempre me consulte antes de seguir.

### 4. Revisão

Depois que tudo estiver definido, faça uma revisão crítica procurando:

* Simplificações
* Riscos
* Regras redundantes com o que já existe nos docs
* Oportunidades de melhorar a experiência do usuário
* Divergências entre o que decidimos e o que está nos docs (e se algum doc precisa ser atualizado no mesmo PR)

### 5. Especificação

Gere um documento em Markdown contendo apenas o que foi decidido durante nossa conversa.

Inclua:

* Objetivo
* Escopo
* Fora do escopo
* Fluxo (referenciando `docs/fluxos/*.md` quando aplicável, sem duplicar)
* Regras de negócio (novas ou consolidadas; se já existem nos docs, apenas cite)
* Estados
* Validações
* Casos de borda
* Dependências (fatias, entidades, pacotes)
* Critérios de aceite
* **Atualizações necessárias em `docs/`** (se alguma ambiguidade foi resolvida, indicar qual arquivo atualizar no mesmo PR)

### 6. Testes

Liste os cenários de teste necessários, classificados em:

* Crítico
* Importante
* Opcional

Explique o objetivo de cada cenário, sem escrever os testes. Considere que o projeto prioriza teste manual seguindo `docs/fluxos/*.md`; testes automatizados são para regras críticas (multi-tenant, cálculos, geração de slots, fluxo de pagamento).

### 7. Plano de implementação

Divida a implementação em pequenas fases independentes.

Cada fase deve conter:

* Objetivo
* Escopo
* Arquivos/pastas afetados (backend, shared/schema, frontend)
* Dependências
* Critério de conclusão

Considere o padrão do projeto:

* Schema Drizzle em `shared/schema/src/tables/*.ts` (pacote `@fluy/schema`, só depende de `drizzle-orm`, `drizzle-zod`, `zod`).
* Backend em módulos Nest com padrão `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts` (repository usa Drizzle direto).
* Convenção: nomes de infra/framework em inglês; nomes de domínio (entidades, métodos de negócio, rotas) em português.
* Migrations via `drizzle-kit push` (dev).

Só considere a fatia pronta para implementação quando todas as decisões tiverem sido tomadas e todas as ambiguidades resolvidas.
