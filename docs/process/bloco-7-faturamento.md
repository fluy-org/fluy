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

- [ ] Backend do fechamento: toda a regra de cálculo, exposta por API e coberta por teste. — **🟣 Rudney** — [DEP: 3.2](./bloco-3-painel-operacao.md#32-conclusão-de-atendimento-e-pagamento-manual) · [DEP: 3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento)

**O que deve existir**

*Backend*

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

- **Ambig #5** — cancelamento de agendamento passado pelo salão: rebate no período atual ou reabre o período fechado? Vem da [3.3](./bloco-3-painel-operacao.md#33-encerramentos-sem-atendimento-no-show-e-cancelamento) e precisa estar resolvida aqui.
- **Fonte única do "quanto a cliente gastou"**: o "total gasto" da ficha ([5.1](./bloco-5-ficha-cliente.md#51-lista-e-ficha-da-cliente)) e o "total faturado" daqui têm que sair da mesma regra.
- Sinal retido em cancelamento pelo salão conta como receita antes de o reembolso existir? MVP: conta, e o [Bloco 9](./bloco-9-pagamento-online.md) ajusta.

**Critério de conclusão**

API respondendo os quatro blocos do fluxo 13 para um período semeado, com
**teste automatizado** cobrindo: virada de período no fuso do salão, sinal
retido por no-show, sinal retido por cancelamento, e concluído sem método
registrado. Faturamento é uma das quatro áreas com teste obrigatório no
[CLAUDE.md](../../CLAUDE.md).

**Tamanho estimado:** ~45-55 arquivos.

---

### 7.2 Dashboard de faturamento

- [ ] Tela de fechamento de período consumindo a agregação. — **🟣 Rudney** — [DEP: 7.1](#71-agregação-de-período) `[DECIDIR: período padrão ao abrir a tela]`

**O que deve existir**

*Frontend*

- Seletor de período com os presets e o intervalo customizado.
- **Seção 1 — Resumo:** total faturado, número de atendimentos concluídos, ticket médio.
- **Seção 2 — Atendimentos realizados:** tabela com data, cliente, procedimento, valor total, sinal (valor + método) e restante (valor + método), paginada.
- **Seção 3 — Recebimento por método.**
- **Seção 4 — Sinais retidos por cancelamento e no-show:** data, cliente, procedimento que não aconteceu, valor do sinal e motivo.
- Alerta de dado incompleto ("N atendimentos sem método registrado") e destaque dos concluídos com restante pendente.
- Estado vazio para período sem movimento; e o caso de período só com cancelamentos, em que o total vem só da seção 4.
- Valores e datas no fuso do salão.

**Decisões que precisam estar fechadas antes**

- Qual período abre por padrão? O fluxo 13 não crava; recomendação: semana atual.

**Critério de conclusão**

`flows/salao/13-faturamento.md` ponta a ponta: semear um período com concluídos
(sinal + restante em métodos diferentes), um no-show e um cancelamento, e
conferir as quatro seções. Mais o período vazio e o alerta de dado incompleto.

**Tamanho estimado:** ~50-60 arquivos.

---

## Dependências

Só do [Bloco 3](./bloco-3-painel-operacao.md), do mesmo dono. Zero dependência
externa.

## Sequência

7.1 → 7.2. A regra de cálculo primeiro, porque é onde estão as decisões e o
teste; a tela depois, consumindo uma API já validada.
