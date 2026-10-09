# Bloco 7 — Faturamento

**Dono único: 🟣 Rudney.** Feature vertical completa: fechamento de período.

Roda **em paralelo** com o [Bloco 8](./bloco-8-anexos-agendamento.md).

## Por que este bloco existe assim

Faturamento é cálculo derivado sobre `agendamento` + `pagamento_agendamento` +
`evento_agendamento` — exatamente os três registros que o
[Bloco 3](./bloco-3-painel-operacao.md) escreve. Quem escreveu as transições
sabe em que evento cada valor cai e não precisa perguntar.

Não tem entidade nova nem depende de trabalho em curso: é o bloco mais isolado
do plano depois do Bloco 3.

## Entregável do bloco

Ao final, o salão consegue:

- Escolher um período (presets + intervalo customizado), sempre no fuso do salão.
- Ver total faturado, atendimentos concluídos e ticket médio.
- Ver a tabela de atendimentos realizados com valores congelados.
- Ver o recebimento agregado por método.
- Ver os sinais retidos por cancelamento e no-show, com motivo.
- Ser alertado de dado incompleto.

## Estado do schema

**Sem entidade nova.** Faturamento é agregação sobre tabelas que já existem.

---

## Fatias

### 7.1 Agregação de período

- [x] Backend do fechamento: toda a regra de cálculo, exposta por API e coberta por teste. — **🟣 Rudney** — [DEP: 3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual) · [DEP: 3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento)

**O que deve existir**

_Backend_

- Resolução do período a partir de preset (semana atual, semana anterior, mês atual, mês anterior, quinzena) ou intervalo customizado.
- **Período resolvido no fuso de `salao.fuso_horario`** — é o fuso do salão que decide em qual período um evento na virada do dia ou do mês cai.
- **Base temporal é a data do `evento_agendamento`**, não `inicio_em` e não a data do pagamento. Para sinais retidos, a data do cancelamento ou do no-show.
- "Faturado" = valor **efetivamente recebido**. Não entram: reservas não pagas, agendamentos futuros, e valor pendente de concluído sem registro do restante.
- Totais do resumo: total faturado, número de concluídos, ticket médio.
- Lista de atendimentos realizados com data, cliente, procedimento, valor total, sinal (valor + método) e restante (valor + método), **sempre com os valores congelados no agendamento**, nunca o preço atual do catálogo.
- Agregação de recebimento por método de pagamento.
- Sinais retidos por cancelamento e no-show, em conjunto separado, com o motivo distinguindo cancelamento pela cliente, no-show e cancelamento pelo salão sem reembolso.
- Sinalização de dado incompleto: concluídos sem método do restante registrado, e concluídos com valor restante ainda pendente.
- Paginação da lista de atendimentos, para salão com volume grande.
- Filtro por `salao_id` em toda query.

**Fora desta fatia**

- A tela (7.2).
- Reembolso de sinal, que muda o que conta como receita → [9.3](./bloco-9-pagamento-online.md#93-reembolso-no-cancelamento).
- Fora do MVP, confirmado nos fluxos: exportação CSV/PDF, gráficos, comparativo com período anterior, coluna por profissional, comissões, reconciliação com extrato, registro explícito de desconto.

**Decisões que precisam estar fechadas antes**

- ~~**Ambig #5**~~ — **resolvida na [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento): rebate no período atual, nunca reabre período fechado.** O período de um encerramento é sempre o do `evento_agendamento`, não o de `inicio_em` — vale igual para conclusão, cancelamento e no-show.
- **Fonte única do "quanto a cliente gastou"**: o "total gasto" da ficha ([5.1](./bloco-5-ficha-cliente.md#51-lista-e-ficha-da-cliente)) e o "total faturado" daqui têm que sair da mesma regra.
- Sinal retido em cancelamento pelo salão conta como receita antes de o reembolso existir? MVP: conta, e o [Bloco 9](./bloco-9-pagamento-online.md) ajusta.

**Decisões fechadas no planejamento**

- **Fonte única** — o "total gasto" da ficha e o "total faturado" usam o mesmo cálculo de valor recebido, e os dois só contam agendamentos em `concluido`, `cancelado` ou `falta` (a ficha contava sinal de agendamento futuro).
- **Quem cancelou e o que é sinal** — não eram gravados. Entraram `evento_agendamento.cancelado_por` e `pagamento_agendamento.tipo`, por migração aditiva com preenchimento dos registros existentes.
- **Presets** — semana de segunda a domingo; quinzena é a atual do mês (1–15 ou 16–fim).
- **Resumo** — total faturado inclui sinais retidos; ticket médio é o recebido dos concluídos ÷ concluídos; "sem método registrado" e "restante pendente" são um alerta só.
- **API** — `GET /faturamento` (período resolvido, resumo, recebimento por método e sinais retidos) e `GET /faturamento/atendimentos` (lista paginada). Datas trafegam como instante + `fuso_horario`.
- **Reembolso** — não é descontado no faturamento por período até a [9.3](./bloco-9-pagamento-online.md#93-reembolso-no-cancelamento).

**Critério de conclusão**

API respondendo os quatro blocos do fluxo 13 para um período semeado, com
**teste automatizado** cobrindo: virada de período no fuso do salão, sinal
retido por no-show, sinal retido por cancelamento, e concluído sem método
registrado. Faturamento é uma das quatro áreas com teste obrigatório no
[CLAUDE.md](../../CLAUDE.md).

**Tamanho estimado:** ~45-55 arquivos.

---

### 7.2 Dashboard de faturamento

- [x] Tela de fechamento de período consumindo a agregação. — **🟣 Rudney** — [DEP: 7.1](#71-agregação-de-período)

**O que deve existir**

_Frontend_

- Seletor de período com os presets e o intervalo customizado.
- **Seção 1 — Resumo:** total faturado, número de atendimentos concluídos, ticket médio.
- **Seção 2 — Atendimentos realizados:** tabela com data, cliente, procedimento, valor total, sinal (valor + método) e restante (valor + método), paginada.
- **Seção 3 — Recebimento por método.**
- **Seção 4 — Sinais retidos por cancelamento e no-show:** data, cliente, procedimento que não aconteceu, valor do sinal e motivo.
- Alerta de dado incompleto ("N atendimentos sem método registrado") e destaque dos concluídos com restante pendente.
- Estado vazio para período sem movimento; e o caso de período só com cancelamentos, em que o total vem só da seção 4.
- Valores e datas no fuso do salão.

**Decisões que precisam estar fechadas antes**

- Nenhuma pendência de decisão. O período padrão foi fechado no planejamento.

**Decisões fechadas no planejamento**

- **Abertura e retorno** — o filtro válido da URL é restaurado, com nova consulta a cada entrada. O menu e URLs sem filtro válido abrem a semana atual, resolvida no fuso do salão.
- **Seleção** — presets aplicam imediatamente e usam `periodo` na URL; intervalo customizado usa `data_inicio` e `data_fim` após Aplicar. O rascunho não altera a URL. Atualização, compartilhamento e histórico restauram o filtro; filtros inválidos são normalizados para a semana atual substituindo a entrada de histórico.
- **Carregamento** — consultar primeiro o resumo e usar suas datas resolvidas na lista; exibir as quatro seções após ambas as consultas funcionarem. Falha inicial oferece nova tentativa do período inteiro.
- **Paginação** — infinite scroll ao final do conteúdo, deduplicação por `agendamento_id`; falha preserva os itens e permite repetir a próxima página.
- **Apresentação** — tabela acima de 900 px e cards até 900 px, com os mesmos campos; eventos com data e hora no fuso do salão; ticket médio nulo e pagamentos ausentes como “—”.
- **Pendência** — alerta informativo e destaque textual e visual do restante pendente, sem ação de correção financeira nesta tela.
- **Navegação de consulta** — nomes das clientes abrem a ficha existente; atendimentos e sinais retidos oferecem acesso ao detalhe do agendamento. Procedimentos permanecem como texto até existir uma página individual de consulta.

**Critério de conclusão**

`flows/salao/13-faturamento.md` ponta a ponta: semear um período com concluídos
(sinal + restante em métodos diferentes), um no-show e um cancelamento, e
conferir as quatro seções. Mais o período vazio e o alerta de dado incompleto.

**Estado da validação**

- Tela e navegação implementadas; typecheck, build e lint dos arquivos da feature aprovados.
- Regressão existente: 46 testes de faturamento, autenticação e contexto do salão aprovados.
- Interface conferida no Chrome com respostas simuladas: quatro seções, fuso distinto do dispositivo, tabela/cards (900/901 px), intervalo customizado, períodos vazio/só sinais/receita zero, falhas iniciais e de paginação, infinite scroll, deduplicação, respostas atrasadas e saída/retorno à tela.
- Nova apresentação conferida entre 320 e 1440 px, com indicadores em cards, valores alinhados, foco por teclado e links abrindo as rotas existentes de cliente e agendamento com os IDs do relatório. A conferência de navegação usou respostas simuladas nas páginas de destino.
- Filtro por URL conferido com respostas simuladas: cinco presets, intervalo customizado, rascunho/Aplicar, atualização da página, voltar/avançar, retorno de ficha, parâmetros inválidos/repetidos, preservação de parâmetros externos e troca de URL durante consulta. Cada alteração válida dispara uma única consulta inicial, inclusive no ciclo de navegação do Ionic.
- O aceite ponta a ponta com backend autenticado e dados semeados permanece pendente; a checkbox só deve ser marcada após essa conferência.

**Tamanho estimado:** ~50-60 arquivos.

---

## Dependências

Só do [Bloco 3](./bloco-3-painel-operacao.md), do mesmo dono. Zero dependência
externa.

## Sequência

7.1 → 7.2. A regra de cálculo primeiro, porque é onde estão as decisões e o
teste; a tela depois, consumindo uma API já validada.
