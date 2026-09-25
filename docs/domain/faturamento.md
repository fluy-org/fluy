# Faturamento

O faturamento **não é uma entidade persistida** — é um **agregado calculado** sobre os dados já existentes no domínio (agendamentos concluídos, cobranças confirmadas, reembolsos, sinais retidos em cancelamentos e no-shows). Este documento existe para deixar claro por que o módulo não introduz entidades novas.

---

## Por que não há entidade

O relatório de faturamento é sempre derivado de:

- **Agendamentos concluídos** no período (para "atendimentos realizados").
- **Cobranças confirmadas** referenciadas pelos `pagamento_agendamento` desses agendamentos (para "recebimento por método").
- **Cobranças confirmadas** cujos agendamentos terminaram em `cancelado` (pela cliente, ou pelo salão sem reembolso) ou `no_show` (para "sinais retidos").
- **Reembolsos confirmados** no período (que não entram como receita).

Todo esse recorte é reprodutível a qualquer momento a partir do estado atual do banco. **Persistir uma entidade `faturamento_periodo` seria cache/otimização, não domínio** — e o projeto rejeita entidades técnicas.

## Regras de cálculo

Estão descritas em [features/faturamento.md](../features/faturamento.md) e detalhadas em [fluxos/salao/13-faturamento.md](../fluxos/salao/13-faturamento.md). Resumo:

- **Base temporal:**
  - Atendimentos: data de conclusão (`evento_agendamento.ocorreu_em` com `tipo = concluido`).
  - Sinais retidos: data do cancelamento ou no-show.
- **"Faturado" = efetivamente recebido.** Não inclui reservas, agendamentos futuros nem restantes pendentes.
- **Valores congelados** (do `agendamento`) são a fonte, não os valores atuais do procedimento.
- **Cancelamento pelo salão com reembolso** não entra como receita (o reembolso zera).
- **Fuso do salão** determina em qual período cada evento cai.

## Métricas derivadas da ficha da cliente

Também são cálculos, não campos persistidos:

- **Total gasto acumulado** = mesma regra do "total faturado": soma das cobranças confirmadas (manual sempre; gateway com `status = confirmada`) vinculadas por `pagamento_agendamento` a qualquer agendamento da cliente — concluídos e sinais retidos em `cancelado`/`falta` — menos os reembolsos confirmados dessas cobranças. Dois números diferentes para "quanto entrou" no produto seriam bug de confiança.
- **Total de agendamentos** = contagem dos estados `agendado`, `concluido`, `cancelado` e `falta`; reserva ainda não confirmada (`reservado`) não conta.
- **No-shows e cancelamentos** = contagem por estado (`falta`, `cancelado`).
- **Último atendimento** = `inicio_em` do agendamento em `concluido` mais recente.

## Features relacionadas

- [Faturamento](../features/faturamento.md)
- [Gestão de Clientes e Histórico](../features/gestao-clientes.md) (métricas na ficha)

## Observações

- **Se o volume tornar o cálculo caro** no futuro, cache pode entrar como camada de implementação (materialized view, tabela de captura periódica, cache curto em memória) — **sem virar entidade de domínio**.
- **Refund tardio em período fechado** (rebate no período atual vs. reabrir) permanece como decisão de negócio em aberto — impacta o cálculo, não a modelagem.
- **Coluna/filtro por profissional** no futuro multi-profissional é natural: `agendamento.profissional_id` já existe.
