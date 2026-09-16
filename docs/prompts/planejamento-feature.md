# Planejamento de Feature — Fluy

A seguir vou descrever a fatia que quero implementar.

<!-- COLE AQUI a entrada completa da fatia, copiada de docs/process/bloco-N-*.md.
     Copie a seção inteira da fatia, não só a linha de checkbox: as seções
     "O que deve existir", "Fora desta fatia", "Decisões que precisam estar
     fechadas antes" e "Critério de conclusão" são o escopo fechado. -->

## Contexto do repositório

Este é um mono-repo do projeto **Fluy** (SaaS multi-tenant para salões de beleza, NestJS + Angular + Drizzle).

A documentação oficial vive em:

- `docs/domain/` — modelo de domínio (entidades, relacionamentos, regras).
- `docs/features/` — capacidades do sistema, agrupamento de fluxos.
- `docs/flows/` — fluxos de usuário detalhados. **Fonte oficial de regras de negócio.**
- `docs/flows/PENDENCIAS.md` — decisões adiadas do projeto.
- `docs/process/` — organização do trabalho (blocos, fatias, setup).
- `CLAUDE.md` — **as regras de implementação do projeto**. Existem em cascata: raiz, `backend/`, `frontend/` e várias subpastas de `backend/src/`. Cada nível adiciona regra ao anterior.

### Leitura obrigatória (sempre)

Antes de qualquer coisa, leia:

1. A entrada da fatia no bloco correspondente em `docs/process/bloco-N-*.md` — a seção inteira, não só a linha de checkbox.
2. `CLAUDE.md` da raiz.
3. **Toda a cadeia de `CLAUDE.md` das pastas que a fatia vai tocar**, da mais geral para a mais específica. Eles são hierárquicos e cada nível adiciona regra: `backend/CLAUDE.md` → `backend/src/CLAUDE.md` → `backend/src/modules/CLAUDE.md` → `backend/src/modules/<feature>/CLAUDE.md`, quando existir. O mesmo vale para `frontend/`.

Rode `find . -name "CLAUDE.md" -not -path "*/node_modules/*"` para saber quais existem antes de decidir quais ler. Ler só o da raiz **não** é suficiente: as regras de estrutura de módulo, nomes, camadas e erros vivem nos níveis mais profundos.

Isso é o mínimo pra você saber do que se trata e não fazer suposições cegas.

### Os `CLAUDE.md` são regra, não sugestão

Os `CLAUDE.md` descrevem os padrões **já estabelecidos** do projeto. Eles não são contexto de apoio para você interpretar como quiser: são a especificação de como se implementa aqui.

**Hierarquia de decisão.** Ao decidir qualquer coisa de estrutura, nome, camada ou abordagem, siga nesta ordem e só desça um nível quando o anterior não responder:

1. **Regra explícita em `CLAUDE.md`.** Se existe, segue. Não reinterprete, não "melhore", não adapte ao seu gosto.
2. **Implementação de referência que o `CLAUDE.md` aponta.** Vários `CLAUDE.md` nomeiam um módulo ou feature como referência. Leia o código dela e siga o padrão.
3. **Padrão recorrente no código, ainda não documentado.** Procure 2+ implementações equivalentes e siga o que elas fazem. Ao encontrar um padrão claro e não documentado, **me avise** — provavelmente deveria virar regra.
4. **Decisão arquitetural nova.** Só quando os três anteriores não resolverem. **Pare e me consulte antes.** Nunca decida sozinho.

**Antes de criar qualquer estrutura, arquivo, camada, abstração ou padrão novo**, procure o equivalente já existente no projeto. Se existir, siga o padrão dele.

Isso não é "copie o arquivo X". Você ainda precisa entender a fatia e julgar se a referência realmente se aplica: uma feature sem persistência não ganha repository só porque a referência tem um. O que não pode é **inventar uma forma nova para um problema que o projeto já resolve de um jeito**.

Quando a fatia pedir algo sem equivalente no projeto, diga isso explicitamente em vez de improvisar — é exatamente o caso de parar e perguntar.

### O que a fatia já traz decidido

Desde a reorganização do [Bloco 3](../process/README.md#reorganização-a-partir-do-bloco-3) em diante, cada fatia já chega com o escopo fechado. **Não reabra o que já está definido ali:**

| Seção da fatia | O que ela já resolve |
|---|---|
| **O que deve existir** | Tudo que precisa estar de pé, por camada. É o "o quê" — o "como" é o que você vai planejar. |
| **Fora desta fatia** | O que parece pertencer mas não é, com link pra onde foi. **Não puxe escopo de volta.** |
| **Decisões que precisam estar fechadas antes** | As pendências que travam. Se alguma continuar em aberto, **pare e me consulte**. |
| **Critério de conclusão** | Qual fluxo de `docs/flows/*.md` roda ponta a ponta quando a fatia fecha. |
| **Tamanho estimado** | A fatia já foi dimensionada para **um PR de 50 a 100 arquivos**. |

Sua tarefa é planejar **como** implementar isso, não redefinir **o que** é.

### Leitura sob demanda (avaliada pela fatia)

Depois da leitura obrigatória, decida o que mais é **relevante para esta fatia específica**. Alguns exemplos:

- Se a fatia toca uma entidade → ler `docs/domain/<modulo>.md`.
- Se a fatia implementa um fluxo → ler o `docs/flows/<ator>/<fluxo>.md` citado no critério de conclusão + a feature em `docs/features/`.
- Se a fatia lista `[BLOQ:xxx]` ou `[DECIDIR:xxx]` → ler a entrada correspondente em `PENDENCIAS.md`.
- Se a fatia altera código existente → ler o(s) arquivo(s) que vão ser tocados.
- Se a fatia depende de outra já concluída → ler o módulo/tela que ela entregou, pra reusar em vez de duplicar.
- Se a fatia é puramente técnica (infra, setup, config, refactor sem mudar comportamento) → provavelmente **não precisa** ler `domain/` ou `flows/`. Justifique.

**Não leia por leitura.** Se um doc não vai influenciar nenhuma decisão desta fatia, não leia.

## Regras

* Não escreva código.
* Não implemente nada.
* Não invente regra de negócio — se não está em `docs/flows/*` ou `docs/domain/*`, pergunte.
* **Não invente padrão de implementação** — se não está em `CLAUDE.md` nem existe equivalente no código, pergunte.
* Não assuma comportamentos.
* Não contradiga nem redefina decisões já estabelecidas nos docs ou nos `CLAUDE.md`.
* **Divergir de um `CLAUDE.md` exige minha aprovação explícita.** Se achar que uma regra está errada ou não serve para esta fatia, diga qual, por quê, e espere — não implemente diferente por conta própria.
* **Não re-fatie a fatia em PRs menores.** Ela já foi dimensionada; as fases do plano são etapas dentro de um PR só.
* **Não traga de volta o que está em "Fora desta fatia".** Se achar que algo de lá é indispensável, avise — não inclua por conta própria.
* Reutilize tudo o que já existir no contexto e no código.
* Questione qualquer ambiguidade antes de continuar.
* Faça apenas uma pergunta por vez.
* Sempre prefira soluções simples e avise caso encontre alguma forma de reduzir a complexidade da fatia.
* Ao encontrar decisão em aberto marcada em `PENDENCIAS.md`, `[DECIDIR:]` na fatia, ou "Dúvidas em aberto" nos fluxos: **pare e me consulte**.

## Processo

### 1. Leitura e ancoragem

Faça a leitura obrigatória. Depois, **antes de ler mais qualquer coisa**, me responda:

1. Resumo em 1-2 linhas do que a fatia pede (com base no bloco).
2. **A lista dos `CLAUDE.md` que você leu** e, para cada um, as regras dele que se aplicam a esta fatia. Se a cadeia de alguma pasta que a fatia toca não foi lida, leia antes de continuar.
3. Qual é a **implementação de referência** que você vai seguir, e por que ela se aplica a esta fatia. Se não houver referência adequada, diga isso.
4. Lista dos arquivos que você pretende ler além do mínimo, com justificativa curta de cada um.
5. Lista dos arquivos que você conscientemente vai **pular** e por quê (só menciona os que seriam candidatos óbvios mas não fazem sentido pra esta fatia).
6. Se alguma "Decisão que precisa estar fechada antes" ainda estiver aberta, avise **agora**.
7. Se houver algo do mínimo obrigatório que não existe ou está incompleto, avise.

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
* Dependências e impactos conhecidos, incluindo fatias já concluídas do mesmo bloco ou de blocos anteriores
* O que já existe e vai ser reusado (módulo, service, componente, schema)
* Pendências de `PENDENCIAS.md` que impactam
* Ambiguidades ou dúvidas em aberto encontradas na leitura

### 3. Descoberta

Conduza a conversa identificando todas as decisões ainda necessárias antes da implementação.

Considere principalmente:

* Fluxo do usuário (confrontando com o `docs/flows/*.md` correspondente)
* Regras de negócio (idem)
* Estados e transições (ver `docs/domain/*.md`)
* Validações
* Casos de borda (comparar com "Casos extremos" dos fluxos)
* Permissões / multi-tenant (filtro por `salao_id`)
* Impactos em fatias futuras que dependem desta
* Regras de fuso horário / normalização (WhatsApp, instantes em UTC, datas e horas civis no fuso do salão)

Nunca invente respostas. Sempre me consulte antes de seguir.

### 4. Revisão

Depois que tudo estiver definido, faça uma revisão crítica procurando:

* **Conformidade com os `CLAUDE.md`**: percorra as regras dos arquivos que você leu e confirme, uma a uma, que o plano as respeita. Aponte qualquer ponto em que o plano diverge e por quê.
* **Padrão novo introduzido sem necessidade**: qualquer estrutura, nome ou abstração do plano que não tenha equivalente no projeto precisa ser justificada aqui ou removida.
* Simplificações
* Riscos
* Regras redundantes com o que já existe nos docs
* Duplicação de algo que uma fatia anterior já entregou
* Oportunidades de melhorar a experiência do usuário
* Divergências entre o que decidimos e o que está nos docs (e se algum doc precisa ser atualizado no mesmo PR)

### 5. Especificação

Gere um documento em Markdown contendo apenas o que foi decidido durante nossa conversa.

**Não copie de volta o que a fatia já dizia** — referencie. O valor aqui é o que a conversa acrescentou.

Inclua:

* Objetivo
* Escopo (só o que a conversa refinou além do "O que deve existir" da fatia)
* Fora do escopo (idem, além do que a fatia já lista)
* Fluxo (referenciando `docs/flows/*.md`, sem duplicar)
* Regras de negócio (novas ou consolidadas; se já existem nos docs, apenas cite)
* Estados
* Validações
* Casos de borda
* Dependências (fatias, entidades, pacotes)
* Critérios de aceite (partindo do "Critério de conclusão" da fatia)
* **Atualizações necessárias em `docs/`** (se alguma ambiguidade foi resolvida, indicar qual arquivo atualizar no mesmo PR — regra do `CLAUDE.md`)

### 6. Testes

Liste os cenários de teste necessários, classificados em:

* Crítico
* Importante
* Opcional

Explique o objetivo de cada cenário, sem escrever os testes.

O projeto prioriza teste manual seguindo `docs/flows/*.md`. Teste automatizado é obrigatório só para regra crítica: **guard multi-tenant, cálculo de faturamento, geração de slots e fluxo de pagamento**.

### 7. Plano de implementação

Divida a implementação em fases ordenadas **dentro desta fatia**. São etapas de um PR só, não PRs separados — a fatia inteira é a unidade de entrega.

Cada fase deve conter:

* Objetivo
* Escopo
* Arquivos/pastas afetados (backend, shared/schema, frontend)
* Dependências entre fases
* Critério de conclusão

**As convenções de implementação não se repetem aqui.** Elas vivem nos `CLAUDE.md` que você leu no passo 1, e é de lá que saem: estrutura de módulo, responsabilidade de cada camada, vocabulário de nomes, tratamento de erro, contratos e testes.

Ao descrever cada fase, aponte qual regra de qual `CLAUDE.md` está sendo aplicada. Se uma fase não tiver regra correspondente em nenhum deles nem equivalente no código, ela é candidata a decisão arquitetural nova — trate como o nível 4 da hierarquia e me consulte.

Dois pontos que valem checagem explícita por serem os erros mais caros:

* **Tabela nova.** As ~23 tabelas do domínio já existem em `shared/schema/src/` desde a fatia 0.4. Confirme antes de propor uma nova — na maioria das fatias o que falta é só schema Zod de request/response.
* **Migration.** Alteração de schema exige migration versionada (`db:generate` + `db:migrate`). `db:push` é restrito a banco local descartável.

Só considere a fatia pronta para implementação quando todas as decisões tiverem sido tomadas e todas as ambiguidades resolvidas.
