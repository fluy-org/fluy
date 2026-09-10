# Bloco 3 — Operação e financeiro

Fecha o loop operacional do salão. Independente do Bloco 4 e 5 — pode ser feito em paralelo com o Bloco 4 (ou até antes).

## Entregável do bloco

Ao final, salão consegue:
- Receber lembretes automáticos (ex: cliente marcou corte há X dias e precisa retornar).
- Criar lembretes manuais para uma cliente.
- Ver dashboard de faturamento do período (concluídos, cancelados, no-show, sinais retidos).

## Fatias

### 3.1 Lembretes

- [ ] `salao/12-lembretes` — lembretes automáticos (criados ao concluir se `procedimento.periodo_manutencao_dias > 0`) + manuais. Entities: `lembrete`. — **🟣 Rudney** — [DEP: 2.4](./bloco-2-motor.md#24-conclusao-de-atendimento)

### 3.2 Faturamento

- [ ] `salao/13-faturamento` — dashboard com totais do período (concluídos, cancelados, no-show, sinais retidos, entradas manuais). Cálculo derivado sobre `agendamento` + `pagamento` + `evento_agendamento`. Sem entidade nova. — **🔵 Leandro** — [DEP: 2.4](./bloco-2-motor.md#24-conclusao-de-atendimento) · [DEP: 2.5](./bloco-2-motor.md#25-no-show) · [DEP: 2.6](./bloco-2-motor.md#26-cancelamento)

## Divisão e por quê

**🟣 Rudney** (1): 3.1 lembretes — regra de negócio no back (criação automática ao concluir), tela relativamente simples.

**🔵 Leandro** (1): 3.2 faturamento — query pesada no back (agregações), mas o valor real está na tela (dashboard, filtros, período). 🔵 Leandro puxa por causa da UX densa.

**Alternância:** ambos pegam algo diferente das últimas fatias — 3.1 depois de 2.7 (remarcação) muda o assunto pra 🟣 Rudney; 3.2 depois de 2.8 (histórico) mantém 🔵 Leandro em telas de leitura densa, mas com query nova no back.

**Sequência:** os dois em paralelo assim que Bloco 2 fechar. Nenhum bloqueio entre 3.1 e 3.2.

## Decisões pendentes deste bloco

- [ ] Formato do período no faturamento (mês? intervalo custom? padrão semana atual?).
- [ ] Lembrete automático quando cliente é criada por 2.1 (bem-vinda?) ou só ao concluir? MVP: só ao concluir.
- [ ] Notificação do lembrete: só in-app no painel do salão, ou push? MVP: in-app.
