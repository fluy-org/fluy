# Pagamentos

## Objetivo

Processar e registrar todo movimento financeiro relacionado a agendamentos: sinal pago pela cliente via gateway online e valor restante ou sinal antecipado pago presencialmente/manualmente, garantindo rastreio para o [[faturamento]].

## Usuários envolvidos

- Cliente final (paga sinal ou total via gateway)
- Salão (registra pagamentos manuais; opera reembolsos)

## Capacidades entregues

### Sinal online (gateway)

- Iniciar transação com gateway a partir do fluxo de criação de agendamento.
- Aceitar pagamento parcial (sinal) ou total conforme escolha da cliente.
- Calcular sinal a partir da configuração do procedimento (percentual ou fixo, congelado no momento do agendamento).
- Confirmar pagamento via webhook (idempotente contra retries) e promover reserva para `Agendado`.
- Permitir múltiplas tentativas de pagamento enquanto a reserva não expirar.
- Suportar tratamento de pagamento recusado, expirado, ou reserva liberada durante checkout.

### Pagamento manual (registro pelo salão)

- Registrar pagamento presencial no ato da conclusão do atendimento com método escolhido (dinheiro, PIX, cartão máquina, outros).
- Registrar sinal já pago em dinheiro / antecipado quando salão cria agendamento manual.
- Registrar "não recebeu valor pendente" (cortesia / perdão) com aviso ao salão.
- Um método por pagamento no MVP — se cliente pagou em 2 métodos, salão escolhe o predominante.

### Reembolso

- Suportar reembolso de sinal em cancelamento pelo salão (política padrão sugerida: reembolsar; salão pode desmarcar).
- Reter sinal em cancelamento pela cliente e em no-show.
- Manter estado consistente quando reembolso falha no gateway ("reembolso pendente" + retry).

### Valor pendente

- Calcular `valor_pendente = valor_total - sinal_pago` e expor no agendamento e na agenda do dia.
- Marcar valor pendente como quitado quando salão registra pagamento do restante ao concluir.

## Documentos de referência

- fluxos/cliente/03-criacao-agendamento.md
- fluxos/salao/05-agendamento-manual.md
- fluxos/salao/07-conclusao-atendimento.md
- fluxos/salao/08-cancelamento.md
- fluxos/salao/10-no-show.md

## Dependências

Depende de:
- [[gestao-procedimentos]] (configuração de sinal por procedimento)
- [[configuracao-do-salao]] (prazo de reserva sem pagamento)
- Integração com gateway de pagamento externo (Woovi ou Asaas — ainda não escolhido)

Usado por:
- [[gestao-agendamentos]] (bloqueia transição `Reservado` → `Agendado`; registra pagamento na conclusão)
- [[faturamento]] (agrega recebimento por método e sinais retidos)

## Observações

- **Gateway de pagamento não está escolhido.** Woovi (só PIX) vs. Asaas (PIX + cartão). Ver PENDENCIAS.md item 1.
- **Titular da conta de recebimento** (salão direto ou split via Fluy) também está adiado; impacta regulação, chargeback e onboarding do salão.
- **Métodos aceitos** para sinal online dependem do gateway.
- **Reembolso automático vs. manual** trava com a escolha do gateway.
- **Comprovante/recibo digital para a cliente** fora do MVP — provável responsabilidade do gateway ou do salão manualmente.
- **Nota fiscal** fora do MVP.
- **Múltiplos pagamentos parciais** do valor restante fora do MVP.
- **Descontos concedidos** (registro explícito) — fluxo não desenhado ainda.
- Webhooks do gateway devem ser sempre idempotentes.
