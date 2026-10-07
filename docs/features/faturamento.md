# Faturamento e Fechamento de Período

## Objetivo

Consolidar a receita do salão em um período selecionado (semana, quinzena, mês, ou intervalo customizado), separando atendimentos concluídos, valores recebidos por método e sinais retidos por cancelamento/no-show, para apoiar fechamento e controle financeiro básico.

## Usuários envolvidos

- Salão (usuário administrativo)

## Capacidades entregues

### Seleção de período

- Presets: semana atual, semana anterior, mês atual, mês anterior, quinzena (semana de segunda a domingo; quinzena atual do mês, 1–15 ou 16–fim).
- Intervalo customizado (data inicial + data final).
- Usar o fuso do salão para determinar em qual período cada evento cai.

### Resumo do período

- Total faturado (efetivamente recebido).
- Número de atendimentos concluídos.
- Ticket médio (recebido dos concluídos ÷ número de concluídos).

### Atendimentos realizados

- Tabela com: data, cliente, procedimento, valor total, sinal (valor + método), restante (valor + método).
- Usar valores congelados no agendamento (não valor atual do catálogo).
- Base de cálculo: data do atendimento **concluído** (não a data do agendamento nem do pagamento).

### Recebimento por método

- Agregação por método: dinheiro, PIX, cartão máquina, sinal via gateway, etc.

### Sinais retidos por cancelamento e no-show

- Seção separada listando: data, cliente, procedimento (que não aconteceu), valor do sinal, motivo (cancelamento pela cliente / no-show / cancelamento pelo salão sem reembolso).
- Base de cálculo: data do cancelamento/no-show.

### Estados de dado incompleto

- Alertar quando existem atendimentos concluídos sem método do restante registrado (situação de erro).
- Destacar atendimentos concluídos com valor restante ainda pendente.
- No modelo atual os dois casos são o mesmo (concluir com "não recebeu" não registra método nem valor) e viram um alerta só.

## Documentos de referência

- fluxos/salao/13-faturamento.md
- fluxos/salao/07-conclusao-atendimento.md (fonte dos atendimentos concluídos e método de pagamento)
- fluxos/salao/08-cancelamento.md (sinais retidos por cancelamento do salão sem reembolso)
- fluxos/salao/10-no-show.md (sinais retidos por no-show)
- fluxos/cliente/04-cancelamento.md (sinais retidos por cancelamento da cliente)

## Dependências

Depende de:
- [[gestao-agendamentos]] (estados terminais alimentam o cálculo)
- [[pagamentos]] (registros de método e reembolsos)
- [[configuracao-do-salao]] (fuso do salão)

Usado por:
- [[gestao-clientes]] (métrica "total gasto acumulado" da cliente)

## Observações

- **"Faturado" = valor efetivamente recebido.** Não inclui reservas não pagas, agendamentos futuros nem valor pendente de atendimentos concluídos sem registro.
- **Sinais retidos são receita real** — aparecem em seção separada para não misturar com atendimentos.
- **Cancelamento pelo salão com reembolso** não aparece como receita.
- **Valores congelados** protegem contra alteração do catálogo depois do agendamento.
- **Exportação (CSV/PDF), gráficos, comparação com período anterior, comissões, reconciliação bancária** estão fora do MVP.
- **Refund tardio em período fechado**: decidido (ambig #5) — rebate no período atual, nunca reabre período fechado. O desconto do reembolso no faturamento por período entra com a 9.3.
- **Descontos concedidos** — fluxo explícito não está desenhado; hoje só cobre indiretamente via "valor pendente = total − sinal".
- **Coluna/filtro por profissional** deve ser prevista na modelagem para o futuro multi-profissional.
