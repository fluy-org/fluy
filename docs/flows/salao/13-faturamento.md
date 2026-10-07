# Salão — Faturamento e fechamento de período

## Objetivo

Consolidar a receita do salão em um período selecionado (semana, quinzena, mês), separando atendimentos realizados, valores recebidos por método, e sinais retidos por cancelamento/no-show.

## Passo a passo

1. Salão acessa "Faturamento" no painel.
2. Sistema pede período:
   - Preset: semana atual / semana anterior / mês atual / mês anterior / quinzena
     - Semana vai de segunda a domingo.
     - Quinzena é a quinzena atual do mês: do dia 1 ao 15 ou do dia 16 ao último dia, conforme a data de hoje no fuso do salão.
   - OU intervalo customizado (data inicial + data final), sem limite de tamanho; a data final não pode ser anterior à inicial.
3. Sistema calcula e exibe:

### Seção 1 — Resumo

- **Total faturado no período** (soma de tudo efetivamente recebido)
- Número de atendimentos concluídos
- Ticket médio: recebido dos atendimentos concluídos ÷ número de concluídos. Sinais retidos não entram. Sem concluídos, não há ticket médio.
- Quantidade de atendimentos com restante pendente (alimenta o alerta de dado incompleto).

### Seção 2 — Atendimentos realizados

Lista tabular, paginada, do mais recente para o mais antigo, com colunas:
- Data (da conclusão, no fuso do salão)
- Cliente
- Procedimento
- Valor total
- Sinal (valor + método)
- Restante (valor + método)
- Valor pendente

Sinal e restante são distinguidos pelo tipo gravado em cada pagamento (`pagamento_agendamento.tipo`), não pelo método.

### Seção 3 — Recebimento por método

Ex.:
- Dinheiro: R$ X
- PIX: R$ Y
- Cartão máquina: R$ Z
- Sinal via gateway (PIX/cartão online): R$ W

Inclui os sinais retidos da seção 4: a soma da seção 3 é igual ao total faturado.

### Seção 4 — Sinais retidos por cancelamento e no-show

Lista separada, só com os encerramentos em que algum valor ficou retido (cancelamento ou no-show sem pagamento não aparece aqui):
- Data (do cancelamento ou do no-show, no fuso do salão)
- Cliente
- Procedimento (que não aconteceu)
- Valor do sinal
- Motivo (cancelamento pela cliente / no-show / cancelamento pelo salão sem reembolso), a partir de quem cancelou (`evento_agendamento.cancelado_por`)

4. Salão pode exportar? (fora do MVP; ver dúvidas)

## Variações

- **Período sem atendimentos:** exibe estado vazio.
- **Período com só cancelamentos/no-shows:** total faturado é só a seção 4.
- **Período com um agendamento em andamento (`Reservado`):** não conta (só entra o que foi efetivamente recebido).
- **Período que atravessa mudança de configuração** (ex.: preço do procedimento mudou no meio): usa valores congelados nos agendamentos.

## Regras de negócio

- **"Faturado" = valor efetivamente recebido.** NÃO inclui:
  - Reservas ainda não pagas
  - Agendamentos futuros
  - Valor pendente de atendimentos concluídos sem registro do restante (situação de erro)
- **Sinais retidos são receita real** e aparecem em seção separada (não são "atendimento" mas são dinheiro que entrou).
- **Cancelamento pelo salão com reembolso** NÃO aparece como receita (foi devolvido).
- **Períodos possíveis:** semana, quinzena, mês (predefinidos) + intervalo customizado.
- **Base de cálculo:** data do atendimento concluído (não data do agendamento nem data do pagamento). Para sinais retidos: data do cancelamento/no-show.
- **Valores congelados** — se o salão mudou o preço do procedimento, atendimentos passados usam o valor que estava no momento do agendamento.

## Dependências

- **Fluxos de conclusão, cancelamento, no-show** (alimentam os dados).
- **Sistema de registro de pagamento manual** (método usado no restante).
- **Sistema de sinais via gateway** (método usado no sinal).

## Casos extremos (edge cases)

- **Agendamento concluído mas sem registro de método do restante:** dado incompleto. Sistema deve alertar ("N atendimentos sem método registrado"), pedir para o salão corrigir. No modelo atual é o mesmo caso do "restante pendente" abaixo (concluir com "não recebeu" não registra método nem valor), então os dois viram um alerta só.
- **Refund tardio:** decidido (ambig #5) — rebate no período atual, nunca reabre período fechado. Até a [9.3](../../process/bloco-9-pagamento-online.md#93-reembolso-no-cancelamento), o faturamento por período não desconta reembolso.
- **Fuso horário na virada do dia/mês:** usar fuso do salão para determinar em qual período o atendimento cai.
- **Salão altera valor de um procedimento após o atendimento** (raramente): valores congelados protegem, mas se salão editar retroativamente o agendamento, precisa revalidar.
- **Múltiplos usuários (futuro) alterando dados durante o cálculo:** cache curto ou cálculo em tempo real.
- **Volume grande de atendimentos** (salões maiores): paginação da tabela.
- **Cliente ainda não pagou o restante ao final do período:** atendimento aparece na lista mas com "restante pendente" destacado.

## Dúvidas em aberto

- **Exportação (CSV, PDF):** demanda comum para contabilidade; fora do MVP.
- **Comparação com período anterior** (semana vs. semana anterior): útil como indicador; fora do MVP mas fácil.
- **Gráficos visuais** (barras, pizza): fora do MVP; foco em números tabulares.
- **Faturamento por profissional** (futuro multi-profissional): já prever coluna/filtro na modelagem.
- **Descontos concedidos** (ex.: cortesia, promoção): o valor cobrado foi menor que o cadastrado; precisa registrar diferença. MVP: cobre via "valor pendente = valor total - sinal - desconto", mas fluxo não está desenhado aqui.
- **Comissões (quando multi-profissional):** fora do MVP.
- **Taxa do Fluy** (quando entrar cobrança do SaaS): não aparece como despesa do salão neste relatório? Ou aparece? Fora do MVP.
- **Reconciliação com extrato bancário / gateway:** fora do MVP.
